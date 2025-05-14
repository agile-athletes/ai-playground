#!/usr/bin/env python3
"""
Integration test for MQTT messaging with the Mosquitto server.
Tests sending messages to the MQTT server with JWT authentication.
"""
import os
import sys
import json
import time
import socket
import unittest
import datetime
import logging
import uuid
import paho.mqtt.client as mqtt
import jwt

# Import dotenv for .env file loading
try:
    from dotenv import load_dotenv
    # Load environment variables from .env file
    # The .env file is in the integration_tests directory
    integration_tests_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(integration_tests_dir, '.env')
    load_dotenv(env_path)
    print(f"Loaded environment variables from {env_path}")
except ImportError:
    print("python-dotenv package not installed. Environment variables from .env file will not be loaded.")
    print("Install with: pip install python-dotenv")

# Add the parent directory to the path so we can import from the parent package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
# WebSocket MQTT configuration
MQTT_HOST = "ai.agile-athletes.de"  # Hostname for the MQTT server
MQTT_PORT = 443  # Default WSS port
MQTT_PATH = "/mqtt"  # Path for the MQTT WebSocket endpoint
MQTT_TOPICS = ["reasoning", "workflows", "attentions"]
TIMEOUT_SECONDS = 10

# Flag to determine if we're running in a test environment
TEST_MODE = os.environ.get('TEST_MODE', 'True').lower() in ('true', '1', 't')
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class TestMqttMessaging(unittest.TestCase):
    """Test MQTT messaging with the Mosquitto server."""

    def setUp(self):
        """Set up the test environment."""
        # Create a unique client ID for this test run
        self.client_id = f"mqtt-test-{datetime.datetime.utcnow().timestamp()}"
        
        # Create MQTT client with WebSocket transport
        self.mqtt_client = mqtt.Client(client_id=self.client_id, transport="websockets")
        
        # Set up message tracking
        self.received_messages = {topic: [] for topic in MQTT_TOPICS}
        self.connection_success = False
        
        # Set up callbacks
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        
        # Get JWT token
        self.jwt_token = self.create_valid_jwt()
        
        # TLS configuration is done in each test method
        # This allows more flexibility in how we connect

    def tearDown(self):
        """Clean up after the test."""
        # Disconnect MQTT client if connected
        if hasattr(self, 'mqtt_client') and self.mqtt_client.is_connected():
            self.mqtt_client.disconnect()
            self.mqtt_client.loop_stop()
            logger.info("MQTT client disconnected")

    def on_connect(self, client, userdata, flags, rc):
        """Callback for when the client connects to the MQTT broker."""
        if rc == 0:
            logger.info("Connected to MQTT broker successfully")
            self.connection_success = True
            
            # Subscribe to all topics
            for topic in MQTT_TOPICS:
                client.subscribe(topic)
                logger.info(f"Subscribed to topic: {topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker with code: {rc}")
            self.connection_success = False

    def on_message(self, client, userdata, msg):
        """Callback for when a message is received from the MQTT broker."""
        topic = msg.topic
        payload = msg.payload.decode('utf-8')
        logger.info(f"Received message from topic {topic}: {payload}")
        
        # Store the message
        if topic in self.received_messages:
            self.received_messages[topic].append(payload)

    def create_valid_jwt(self):
        """Create a valid JWT token with the correct user_id."""
        # Create a valid JWT token with the correct user_id
        now = datetime.datetime.utcnow()
        expiration = now + datetime.timedelta(hours=24)

        # Create payload with standard claims and the correct user_id
        payload = {
            "iat": now.timestamp(),                # Issued at
            "exp": expiration.timestamp(),         # Expiration time
            "user_id": "user@example.com"  # Custom claim: user ID for happy flow
        }
        
        # Get the secret key from environment variables
        secret = os.environ.get('JWT_SECRET')
        
        # Check if the secret is available
        if secret:
            logger.info("Using JWT_SECRET from environment variables")
        else:
            OSError()
        
        # Create the token
        valid_token = jwt.encode(payload, secret, algorithm="HS256")
        logger.info(f"Created valid JWT token: {valid_token}")
        
        return valid_token

    def test_mqtt_connection_with_valid_jwt(self):
        """Test connecting to the MQTT server with a valid JWT token."""
        try:
            # Construct the WebSocket URL
            mqtt_ws_url = f"wss://{MQTT_HOST}{MQTT_PATH}"
            
            # Connect to MQTT broker using WebSockets
            logger.info(f"Connecting to MQTT broker at {mqtt_ws_url}")
            
            # Set up TLS for secure WebSocket connection
            self.mqtt_client.tls_set()
            
            # Set the Authorization header directly in the WebSocket options
            # This is a one-step authentication process
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            self.mqtt_client.ws_set_options(path=MQTT_PATH, headers=headers)
            
            # Connect to the MQTT broker
            self.mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
            
            # Start the loop
            self.mqtt_client.loop_start()
            
            # Wait for connection to establish
            start_time = time.time()
            while not self.connection_success and time.time() - start_time < TIMEOUT_SECONDS:
                time.sleep(0.1)
            
            # Assert that connection was successful
            self.assertTrue(self.connection_success, "Failed to connect to MQTT broker")
            
            # Wait a bit to ensure subscriptions are active
            time.sleep(1)
            
            logger.info("Connection test successful")
        except socket.gaierror as e:
            logger.error(f"DNS resolution error: {e}")
            logger.info("This test requires network connectivity to the MQTT server")
            logger.info("Skipping test due to DNS resolution error")
            return
        except ConnectionRefusedError as e:
            logger.error(f"Connection refused: {e}")
            logger.info("The MQTT server is not accepting connections")
            logger.info("Skipping test due to connection refused")
            return
        except Exception as e:
            self.fail(f"Unexpected error: {type(e).__name__}: {e}")

    def test_mqtt_publish_and_receive(self):
        """Test publishing messages to MQTT topics and receiving them back."""
        try:
            # Construct the WebSocket URL
            mqtt_ws_url = f"wss://{MQTT_HOST}{MQTT_PATH}"
            
            # Connect to MQTT broker using WebSockets
            logger.info(f"Connecting to MQTT broker at {mqtt_ws_url}")
            
            # Set up TLS for secure WebSocket connection
            self.mqtt_client.tls_set()
            
            # Set the Authorization header directly in the WebSocket options
            # This is a one-step authentication process
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            self.mqtt_client.ws_set_options(path=MQTT_PATH, headers=headers)
            
            # Connect to the MQTT broker
            self.mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
            
            # Start the loop
            self.mqtt_client.loop_start()
            
            # Wait for connection to establish
            start_time = time.time()
            while not self.connection_success and time.time() - start_time < TIMEOUT_SECONDS:
                time.sleep(0.1)
            
            # Assert that connection was successful
            self.assertTrue(self.connection_success, "Failed to connect to MQTT broker")
            
            # Wait a bit to ensure subscriptions are active
            time.sleep(1)
            
            # Load reasoning messages from sample-response.json
            sample_response_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                'metaprompting', 'in', 'sample-response.json'
            )
            
            # Read the sample response file
            with open(sample_response_path, 'r') as f:
                sample_response = json.load(f)
                
            # Extract reasoning messages from the sample response
            reasoning_messages = sample_response.get('reasoning', [])
            
            # Publish the full reasoning array to each topic
            for topic in MQTT_TOPICS:
                # Add test metadata with the full reasoning array
                test_message = {
                    "test_id": self.client_id,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "reasoning": reasoning_messages
                }
                
                message_json = json.dumps(test_message)
                logger.info(f"Publishing reasoning message to topic {topic}: {message_json}")
                
                # Publish the message
                result = self.mqtt_client.publish(topic, message_json, qos=1)
                
                # Check if publish was successful
                if result.rc != mqtt.MQTT_ERR_SUCCESS:
                    logger.error(f"Failed to publish message to topic {topic}: {result}")
                
                # Wait for message to be published
                result.wait_for_publish()
                logger.info(f"Message published to topic {topic}")
            
            # Wait for messages to be received
            start_time = time.time()
            all_received = False
            
            while not all_received and time.time() - start_time < TIMEOUT_SECONDS:
                # Check if we've received at least one message for each topic
                all_received = all(len(messages) > 0 for messages in self.received_messages.values())
                time.sleep(0.1)
            
            # Assert that we received messages for all topics
            for topic in MQTT_TOPICS:
                self.assertTrue(len(self.received_messages[topic]) > 0, 
                               f"Did not receive any messages for topic {topic}")
                
                # Log the received messages
                for message in self.received_messages[topic]:
                    logger.info(f"Received message for topic {topic}: {message}")
            
            logger.info("Publish and receive test successful")
        except socket.gaierror as e:
            logger.error(f"DNS resolution error: {e}")
            logger.info("This test requires network connectivity to the MQTT server")
            logger.info("Skipping test due to DNS resolution error")
            return
        except ConnectionRefusedError as e:
            logger.error(f"Connection refused: {e}")
            logger.info("The MQTT server is not accepting connections")
            logger.info("Skipping test due to connection refused")
            return
        except Exception as e:
            self.fail(f"Unexpected error: {type(e).__name__}: {e}")

    def test_mqtt_direct_topics(self):
        """Test publishing messages directly to base MQTT topics without session ID."""
        if TEST_MODE and MQTT_HOST == "localhost":
            logger.warning("Skipping MQTT direct topics test in test mode with localhost")
            return
            
        try:
            # Construct the WebSocket URL
            mqtt_ws_url = f"wss://{MQTT_HOST}{MQTT_PATH}"
            
            # Connect to MQTT broker using WebSockets
            logger.info(f"Connecting to MQTT broker at {mqtt_ws_url}")
            
            # Set up TLS for secure WebSocket connection
            self.mqtt_client.tls_set()
            
            # Set the Authorization header directly in the WebSocket options
            # This is a one-step authentication process
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            self.mqtt_client.ws_set_options(path=MQTT_PATH, headers=headers)
            
            # Connect to the MQTT broker
            self.mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
            
            # Start the loop
            self.mqtt_client.loop_start()
            
            # Wait for connection to establish
            start_time = time.time()
            while not self.connection_success and time.time() - start_time < TIMEOUT_SECONDS:
                time.sleep(0.1)
            
            # Assert that connection was successful
            self.assertTrue(self.connection_success, "Failed to connect to MQTT broker")
            
            # Wait a bit to ensure subscriptions are active
            time.sleep(1)
            
            # Publish test messages directly to each base topic (no session ID)
            for topic in MQTT_TOPICS:
                # Create different message types based on the topic
                if topic == "reasoning":
                    test_message = {
                        "consideration": f"Test reasoning message from integration test at {datetime.datetime.utcnow().isoformat()}",
                        "type": "glasspane"
                    }
                elif topic == "workflows":
                    test_message = [
                        {
                            "id": f"test-workflow-{uuid.uuid4()}",
                            "name": "Test Workflow Item",
                            "value": {
                                "url": "test-workflow",
                                "description": "Test workflow from integration test"
                            }
                        }
                    ]
                elif topic == "attentions":
                    test_message = [
                        {
                            "id": f"test-att-{uuid.uuid4()}",
                            "name": "Test Attention Item",
                            "value": "This is a test attention message from the integration test"
                        }
                    ]
                else:
                    test_message = {
                        "test_id": self.client_id,
                        "timestamp": datetime.datetime.utcnow().isoformat(),
                        "message": f"Test message for {topic}",
                        "data": {
                            "value": topic,
                            "source": "integration_test"
                        }
                    }
                
                message_json = json.dumps(test_message)
                logger.info(f"Publishing message directly to base topic {topic}: {message_json}")
                
                # Publish the message to the base topic (no session ID)
                result = self.mqtt_client.publish(topic, message_json, qos=1)
                
                # Check if publish was successful
                if result.rc != mqtt.MQTT_ERR_SUCCESS:
                    logger.error(f"Failed to publish message to topic {topic}: {result}")
                
                # Wait for message to be published
                result.wait_for_publish()
                logger.info(f"Message published to topic {topic}")
                
                # Wait between messages to ensure they're processed separately
                time.sleep(1)
            
            # Wait a bit to ensure messages are processed
            time.sleep(2)
            
            logger.info("Direct topics test completed")
        except socket.gaierror as e:
            logger.error(f"DNS resolution error: {e}")
            logger.info("This test requires network connectivity to the MQTT server")
            logger.info("Skipping test due to DNS resolution error")
            return
        except ConnectionRefusedError as e:
            logger.error(f"Connection refused: {e}")
            logger.info("The MQTT server is not accepting connections")
            logger.info("Skipping test due to connection refused")
            return
        except Exception as e:
            self.fail(f"Unexpected error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    unittest.main()
