#!/usr/bin/env python3
"""
Test für den autonomen Agenten-Fork-Webhook.
Sendet eine POST-Anfrage an den Webhook und zeigt das Ergebnis im Log an.
"""
import json
import unittest
import requests
import logging
import time
from datetime import datetime

# Logging konfigurieren
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TestAutonomousAgentFork(unittest.TestCase):
    """Test für den autonomen Agenten-Fork-Webhook"""

    def setUp(self):
        """Vorbereitung der Testumgebung"""
        # Webhook-URL
        self.webhook_url = "http://localhost:5678/webhook-test/agentfork"
        self.webhook_url = "https://n8n.agile-athletes.de/webhook/agentfork"

        # Standardzeitobjekte erstellen
        self.current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def test_post_to_autonomous_agent_fork(self):
        """Test zum Senden einer POST-Anfrage an den agentfork-Webhook"""

        # Testdaten erstellen
        test_data = [
            { "role": "user", "content": "Fix my issue to the rules of the SWAT framework." }
        ]

        # Headers für die Anfrage
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": "http://localhost:8000",  # Simuliere einen Ursprung für CORS
            "User-Agent": "Python-Tests/1.0"
        }
        
        logger.info(f"Sende POST-Anfrage an {self.webhook_url}")
        logger.info(f"Anfragedaten: {json.dumps(test_data, indent=2)}")
        
        try:
            # POST-Anfrage an den Webhook senden
            response = requests.post(
                self.webhook_url,
                json=test_data,
                headers=headers,
                timeout=30  # 30 Sekunden Timeout
            )
            
            # HTTP-Statuscode überprüfen
            logger.info(f"Statuscode: {response.status_code}")
            self.assertTrue(response.status_code in [200, 201, 202], 
                           f"Unerwarteter Statuscode: {response.status_code}")
            
            # Response-Headers anzeigen
            logger.info("Response-Headers:")
            for key, value in response.headers.items():
                logger.info(f"  {key}: {value}")
            
            # Versuchen, die Antwort als JSON zu parsen
            try:
                response_data = response.json()
                logger.info("Antwortdaten (JSON):")
                logger.info(json.dumps(response_data, indent=2))
                
                # Hier könnten weitere Prüfungen der Antwortdaten erfolgen
                
            except json.JSONDecodeError:
                # Falls keine JSON-Antwort, den Rohtext anzeigen
                logger.info("Antwort ist kein gültiges JSON:")
                logger.info(response.text)
            
        except requests.exceptions.Timeout:
            logger.error("Anfrage hat das Timeout überschritten (30 Sekunden)")
            self.fail("Timeout bei der Anfrage")
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Verbindungsfehler: {e}")
            logger.error("Möglicherweise läuft der n8n-Server nicht oder ist nicht erreichbar.")
            self.fail(f"Verbindungsfehler: {e}")
            
        except Exception as e:
            logger.error(f"Unerwarteter Fehler: {type(e).__name__}: {e}")
            self.fail(f"Unerwarteter Fehler: {e}")

    def test_post_with_webhook_compatible_data(self):
        """Test mit Daten, die dem erwarteten Format eines Webhooks entsprechen"""
        
        # Webhook-kompatible Daten erstellen
        workflow_data = {
            "type": "workflow",
            "label": "SWOT",
            "pitch": "Erklärt die Arbeitsweise von SWOT dem Benutzer",
            "prompt": "RXhwbGFpbiB3aHkgdGhlIHNreSBpcyBibHVlLg==",  # Base64-kodierter Prompt
            "model": "qwen2.5:14b",
            "in-topic": "tasks/agent/process",
            "out-topic": "tasks/agent/result"
        }
        
        # Anfrage mit kompletten Workflow-Daten
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        logger.info(f"Sende Workflow-Daten an {self.webhook_url}")
        logger.info(f"Workflow-Daten: {json.dumps(workflow_data, indent=2)}")
        
        try:
            # POST-Anfrage mit Workflow-Daten senden
            response = requests.post(
                self.webhook_url,
                json=workflow_data,
                headers=headers,
                timeout=60  # Längeres Timeout für LLM-Verarbeitung
            )
            
            # HTTP-Statuscode überprüfen
            logger.info(f"Statuscode: {response.status_code}")
            self.assertTrue(response.status_code in [200, 201, 202], 
                           f"Unerwarteter Statuscode: {response.status_code}")
            
            # Versuchen, die Antwort als JSON zu parsen
            try:
                response_data = response.json()
                logger.info("Workflow-Verarbeitungsergebnis:")
                logger.info(json.dumps(response_data, indent=2))
                
            except json.JSONDecodeError:
                # Falls keine JSON-Antwort, den Rohtext anzeigen
                logger.info("Antwort ist kein gültiges JSON:")
                logger.info(response.text)
            
        except Exception as e:
            logger.error(f"Fehler bei der Workflow-Anfrage: {type(e).__name__}: {e}")
            self.fail(f"Fehler bei der Workflow-Anfrage: {e}")


if __name__ == "__main__":
    unittest.main()