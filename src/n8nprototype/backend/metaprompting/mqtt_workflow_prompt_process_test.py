#!/usr/bin/env python3
"""
Test für das Senden von Workflow-Elementen an einen MQTT-Server und Empfangen der Ergebnisse.
Liest generierte Prompts aus einer JavaScript-Datei und verarbeitet sie über MQTT.
"""
import json
import unittest
import time
import threading
import paho.mqtt.client as mqtt
import logging
import os
from pathlib import Path


# Logging konfigurieren
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class TestMQTTPromptProcessing(unittest.TestCase):
    """Test zum Senden von Workflow-Elementen an einen MQTT-Server und Empfangen der Ergebnisse"""
    
    def setUp(self):
        """Vorbereitung der Testumgebung"""
        # MQTT-Server-Konfiguration
        self.mqtt_host = "localhost"
        self.mqtt_port = 1883
        self.mqtt_client_id = f"metaprompting-test-{int(time.time())}"
        
        # Dateipfad für die generierte JavaScript-Datei
        self.base_dir = Path(__file__).parent
        self.js_file_path = self.base_dir / "out" / "generated_prompts.js"
        
        # Ergebnisse speichern
        self.results = {}
        self.waiting_for_topics = set()
        self.result_received_event = threading.Event()
        
        # MQTT-Client initialisieren (für Paho-MQTT 2.0+)
        # Unterstützt callback_api_version Parameter für neuere Versionen
        try:
            # Zuerst mit der neueren API-Version (2.0+) versuchen
            self.client = mqtt.Client(client_id=self.mqtt_client_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
            logger.info("Verwende Paho-MQTT Callback API Version 1 (für Paho-MQTT 2.0+)")
        except TypeError:
            # Fallback zur älteren API ohne callback_api_version Parameter
            self.client = mqtt.Client(client_id=self.mqtt_client_id)
            logger.info("Verwende Paho-MQTT mit älterer API-Version (vor 2.0)")
        
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        
        # Connect zum MQTT-Server
        try:
            self.client.connect(self.mqtt_host, self.mqtt_port, 60)
            self.client.loop_start()
            logger.info(f"Verbunden mit MQTT-Server {self.mqtt_host}:{self.mqtt_port}")
        except Exception as e:
            logger.error(f"Fehler beim Verbinden mit MQTT-Server: {e}")
            raise
    
    def tearDown(self):
        """Aufräumen nach dem Test"""
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("Verbindung zum MQTT-Server getrennt")
    
    def on_connect(self, client, userdata, flags, rc):
        """Callback für erfolgreiche Verbindung zum MQTT-Server"""
        if rc == 0:
            logger.info("Erfolgreich mit MQTT-Server verbunden")
        else:
            logger.error(f"Verbindung zum MQTT-Server fehlgeschlagen mit Code {rc}")
    
    def on_message(self, client, userdata, msg):
        """Callback für eingehende MQTT-Nachrichten"""
        topic = msg.topic
        payload = msg.payload.decode('utf-8')
        logger.info(f"Nachricht empfangen von Topic {topic}")
        
        # Ergebnis speichern
        self.results[topic] = payload
        
        # Topic aus der Warteschlange entfernen
        if topic in self.waiting_for_topics:
            self.waiting_for_topics.remove(topic)
            
            # Wenn alle erwarteten Ergebnisse eingegangen sind, Event setzen
            if not self.waiting_for_topics:
                self.result_received_event.set()
    
    def test_process_prompts_via_mqtt(self):
        """Test zum Verarbeiten von Workflow-Elementen über MQTT"""
        # Überprüfen, ob die JavaScript-Datei existiert
        self.assertTrue(self.js_file_path.exists(), 
                         f"JavaScript-Datei nicht gefunden: {self.js_file_path}")
        
        # JavaScript-Datei parsen und Resultset extrahieren
        prompts_data = self._extract_resultset_from_js()
        self.assertIsNotNone(prompts_data, "Konnte keine Workflow-Daten aus JavaScript-Datei extrahieren")
        self.assertTrue(len(prompts_data) > 0, "Keine Workflows in der JavaScript-Datei gefunden")
        
        logger.info(f"Gefundene Workflow-Elemente: {len(prompts_data)}")
        
        # Für jedes Workflow-Element das out-topic abonnieren
        for item in prompts_data:
            out_topic = item.get("out-topic")
            if out_topic:
                logger.info(f"Abonniere Ausgabe-Topic: {out_topic}")
                self.client.subscribe(out_topic)
                self.waiting_for_topics.add(out_topic)
        
        # Warten, um sicherzustellen, dass die Abonnements aktiv sind
        time.sleep(1)
        
        # Für jedes Workflow-Element die Daten an das in-topic senden
        for item in prompts_data:
            in_topic = item.get("in-topic")
            label = item.get("label", "Unbekannt")
            
            if in_topic:
                # Workflow-Element direkt senden
                logger.info(f"Sende Workflow '{label}' an Topic {in_topic}")
                self.client.publish(in_topic, json.dumps(item))
        
        # Auf Ergebnisse warten (Timeout nach 60 Sekunden)
        wait_timeout = 60  # Sekunden
        logger.info(f"Warte auf Ergebnisse (Timeout: {wait_timeout}s)...")
        result = self.result_received_event.wait(timeout=wait_timeout)
        
        if not result:
            logger.warning("Timeout beim Warten auf Ergebnisse")
            # Anzeigen, welche Topics noch ausstehen
            if self.waiting_for_topics:
                logger.warning(f"Ausstehende Topics: {self.waiting_for_topics}")
        
        # Ergebnisse ausgeben
        logger.info(f"Empfangene Ergebnisse: {len(self.results)}")
        for topic, payload in self.results.items():
            logger.info(f"Ergebnis von {topic}:")
            try:
                # Versuchen, JSON zu parsen für bessere Lesbarkeit
                parsed_payload = json.loads(payload)
                logger.info(json.dumps(parsed_payload, indent=2))
            except json.JSONDecodeError:
                # Falls kein gültiges JSON, Rohtext ausgeben
                logger.info(payload)
        
        # Sicherstellen, dass mindestens ein Ergebnis empfangen wurde
        self.assertTrue(len(self.results) > 0, "Keine Ergebnisse empfangen")
    
    def _extract_resultset_from_js(self):
        """Extrahiert das resultset-Array aus der JavaScript-Datei"""
        try:
            with open(self.js_file_path, 'r', encoding='utf-8') as file:
                js_content = file.read()
            
            # Nach dem resultset-Array suchen
            start_marker = "const resultset = "
            end_marker = "return resultset"
            
            if start_marker in js_content and end_marker in js_content:
                # Extrahieren des JSON-Teils
                start_idx = js_content.find(start_marker) + len(start_marker)
                end_idx = js_content.find(end_marker)
                
                json_str = js_content[start_idx:end_idx].strip()
                
                # Entfernen eines möglichen abschließenden Semikolons
                if json_str.endswith(';'):
                    json_str = json_str[:-1]
                
                # JSON parsen
                return json.loads(json_str)
            
            return None
        except Exception as e:
            logger.error(f"Fehler beim Extrahieren der Workflow-Daten: {e}")
            return None


if __name__ == "__main__":
    unittest.main()