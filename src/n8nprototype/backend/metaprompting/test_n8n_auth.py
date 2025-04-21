#!/usr/bin/env python3
"""
Test script for the n8n authentication process with two stations
- First endpoint: /webhook-test/request-token
- Second endpoint: /webhook-test/authenticate
"""
import sys
import os
import json
import requests
import time
import unittest
from unittest.mock import patch

# Set a timeout for the request to prevent hanging
TIMEOUT_SECONDS = 10


class TestN8nAuthentication(unittest.TestCase):
    """Test cases for the n8n authentication process with two stations"""
    
    def setUp(self):
        """Set up test environment"""
        self.base_url = "http://localhost:5678"
        self.request_token_url = f"{self.base_url}/webhook/request-token"
        self.authenticate_url = f"{self.base_url}/webhook/authenticate"
        
        # Headers to address CORS issues
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": "http://localhost:8000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,accept"
        }
        
        # Default payloads
        self.token_payload = {
            "email": "test@agile-athletes.org"
        }
    
    def test_request_token(self):
        """Test der ersten Stufe: Anfrage eines Authentifizierungstokens mit anschließender Prüfung der E-Mail"""
        # E-Mail-Adresse für diesen Test setzen
        test_payload = {"email": "test@agile-athletes.de"}
        
        try:
            # 1. POST-Anfrage zum Erhalten eines Tokens
            token_response = requests.post(
                self.request_token_url,
                headers=self.headers,
                json=test_payload,
                timeout=TIMEOUT_SECONDS
            )
            
            # Prüfen, ob die Anfrage erfolgreich war
            self.assertEqual(token_response.status_code, 200, 
                         f"Erwarteter Statuscode 200, erhalten {token_response.status_code}. Antwort: {token_response.text}")
            
            # 2. E-Mail-Inhalt über den zweiten Endpunkt abrufen
            # Wir warten kurz, damit die E-Mail verarbeitet werden kann
            time.sleep(2)
            
            # Endpunkt für das Abrufen der E-Mail
            email_endpoint = f"{self.base_url}/webhook/emailtokenfromtestaccount"
            
            # GET-Anfrage zum Abrufen des E-Mail-Inhalts
            email_response = requests.get(
                email_endpoint,
                headers=self.headers,
                timeout=TIMEOUT_SECONDS
            )
            
            # Prüfen, ob die E-Mail-Anfrage erfolgreich war
            self.assertEqual(email_response.status_code, 200, 
                      f"Erwarteter Statuscode 200 für E-Mail-Abruf, erhalten {email_response.status_code}. Antwort: {email_response.text}")
            
            # Extrahieren der E-Mail-Daten (kann ein Array sein)
            response_content = email_response.json()
            
            # Überprüfen, ob wir ein Array oder ein einzelnes Objekt haben
            if isinstance(response_content, list):
                # Wenn es ein Array ist, nehmen wir das letzte Element (neueste E-Mail)
                email_data = response_content[-1]
            else:
                # Wenn es ein einzelnes Objekt ist, verwenden wir es direkt
                email_data = response_content
            
            # Prüfen, ob textContent im E-Mail-Daten vorhanden ist
            self.assertIn("textContent", email_data, "Die E-Mail-Antwort sollte ein textContent-Feld haben")
            
            # Extrahieren des Tokens aus textContent mit regulärem Ausdruck
            import re
            text_content = email_data["textContent"]
            token_match = re.search(r"Your login token is: (\d+)", text_content)
            
            self.assertIsNotNone(token_match, "Token konnte in der E-Mail-Nachricht nicht gefunden werden")
            
            # Das extrahierte Token
            extracted_token = token_match.group(1)
            print(f"Extrahiertes Token: {extracted_token}")
            
            # Optionale Validierung: Stellen Sie sicher, dass das Token numerisch ist und 5 Stellen hat
            self.assertTrue(extracted_token.isdigit(), "Das Token sollte nur aus Ziffern bestehen")
            self.assertEqual(len(extracted_token), 5, "Das Token sollte 5 Stellen haben")
            
            # Speichern des Tokens für die nächste Teststufe
            self.token_for_authentication = extracted_token
            print(self.token_for_authentication)
        
        except requests.exceptions.Timeout:
            self.fail(f"Anfrage-Timeout nach {TIMEOUT_SECONDS} Sekunden!")
        except requests.exceptions.ConnectionError as e:
            self.fail(f"Verbindungsfehler: {e}")
        except Exception as e:
            self.fail(f"Unerwarteter Fehler: {type(e).__name__}: {e}")

    def test_authenticate_with_token(self):
        """Test der zweiten Stufe: Authentifizierung mit dem Token und Erhalt eines JWT-Tokens"""
        # Festlegen der E-Mail-Adresse und des spezifischen Tokens für die Authentifizierung
        auth_payload = {
            "email": "test@agile-athletes.de",
            "token": "31822"  # Verwenden des bekannten Tokens
        }
        
        try:
            # Authentifizierungsendpunkt
            authenticate_url = f"{self.base_url}/webhook/authenticate"
            
            # POST-Anfrage zur Authentifizierung mit dem Token
            auth_response = requests.post(
                authenticate_url,
                headers=self.headers,
                json=auth_payload,
                timeout=TIMEOUT_SECONDS
            )
            
            # Prüfen, ob die Anfrage erfolgreich war
            self.assertEqual(auth_response.status_code, 200, 
                           f"Erwarteter Statuscode 200, erhalten {auth_response.status_code}. Antwort: {auth_response.text}")
            
            # Antwortdaten extrahieren (als Array)
            jwt_data_array = auth_response.json()
            
            # Überprüfen, ob die Antwort ein Array ist und mindestens ein Element enthält
            self.assertTrue(isinstance(jwt_data_array, list), "Die Antwort sollte ein Array sein")
            self.assertTrue(len(jwt_data_array) > 0, "Die Antwort sollte mindestens ein Element enthalten")
            
            # Das erste Element des Arrays extrahieren
            jwt_data = jwt_data_array[0]
            
            # Überprüfen, ob ein JWT-Token im ersten Element vorhanden ist
            self.assertIn("token", jwt_data, "Das erste Element der Antwort sollte einen JWT-Token enthalten")
            jwt_token = jwt_data["token"]
            
            # Token-Struktur überprüfen
            import jwt
            
            # JWT-Token dekodieren (ohne Signaturüberprüfung)
            try:
                decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})
                
                # Überprüfen der erwarteten Claims im Token
                self.assertIn("user_id", decoded_token, "Der Token sollte einen user_id-Claim enthalten")
                self.assertEqual(decoded_token["user_id"], "test@agile-athletes.de", 
                              "Die user_id im Token sollte mit der E-Mail-Adresse übereinstimmen")
                
                self.assertIn("iat", decoded_token, "Der Token sollte einen iat-Claim (Issued At) enthalten")
                self.assertIn("exp", decoded_token, "Der Token sollte einen exp-Claim (Expiration) enthalten")
                
                # Überprüfen, ob die Ablaufzeit korrekt gesetzt ist (86400 Sekunden = 1 Tag)
                self.assertAlmostEqual(decoded_token["exp"] - decoded_token["iat"], 86400, delta=10,
                                   msg="Die Ablaufzeit sollte etwa 1 Tag (86400 Sekunden) nach der Ausstellungszeit liegen")
                
                print(f"JWT-Token erfolgreich validiert:")
                print(f"User ID: {decoded_token['user_id']}")
                print(f"Ausgestellt (iat): {decoded_token['iat']}")
                print(f"Gültig bis (exp): {decoded_token['exp']}")
                
                # Token für zukünftige Verwendung speichern
                self.jwt_token = jwt_token
                
            except jwt.PyJWTError as e:
                self.fail(f"Fehler beim Dekodieren des JWT-Tokens: {e}")
        
        except requests.exceptions.Timeout:
            self.fail(f"Anfrage-Timeout nach {TIMEOUT_SECONDS} Sekunden!")
        except requests.exceptions.ConnectionError as e:
            self.fail(f"Verbindungsfehler: {e}")
        except Exception as e:
            self.fail(f"Unerwarteter Fehler: {type(e).__name__}: {e}")

    def test_subworkflow_with_jwt(self):
        """Test der dritten Stufe: Verwenden des JWT-Tokens für Zugriff auf einen geschützten Endpunkt"""
        # Stellen Sie sicher, dass ein JWT-Token vorhanden ist
        if not hasattr(self, 'jwt_token') or not self.jwt_token:
            # Führen Sie den Authentifizierungstest durch, um einen JWT-Token zu erhalten
            self.test_authenticate_with_token()
        
        # Stellen Sie sicher, dass wir jetzt einen JWT-Token haben
        self.assertTrue(hasattr(self, 'jwt_token') and self.jwt_token, 
                      "Kein JWT-Token für den Test verfügbar")
        
        try:
            # URL für den testsubworkflow-Endpunkt
            subworkflow_url = f"{self.base_url}/webhook/testsubworkflow"
            
            # Headers mit dem JWT-Token
            auth_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.jwt_token}"
            }
            
            # Beispiel-Payload für den Subworkflow (falls erforderlich)
            payload = {
                "testData": "Dies ist ein Test für den Subworkflow-Endpunkt"
            }
            
            # GET-Anfrage an den Subworkflow-Endpunkt mit JWT-Token
            subworkflow_response = requests.post(
                subworkflow_url,
                headers=auth_headers,
                json=payload,
                timeout=TIMEOUT_SECONDS
            )
            
            # Überprüfen Sie, ob der Statuscode 200 (OK) ist
            self.assertEqual(subworkflow_response.status_code, 200, 
                           f"Erwarteter Statuscode 200, erhalten {subworkflow_response.status_code}. Antwort: {subworkflow_response.text}")
            
            # Optional: Antwortdaten analysieren
            response_data = subworkflow_response.json()
            print(f"Subworkflow-Antwort: {json.dumps(response_data, indent=2)}")
            
            # Hier können weitere Assertions erfolgen, abhängig davon, was der Endpunkt zurückgeben soll
            
            print("Subworkflow-Test erfolgreich durchgeführt!")
            
        except requests.exceptions.Timeout:
            self.fail(f"Anfrage-Timeout nach {TIMEOUT_SECONDS} Sekunden!")
        except requests.exceptions.ConnectionError as e:
            self.fail(f"Verbindungsfehler: {e}")
        except Exception as e:
            self.fail(f"Unerwarteter Fehler: {type(e).__name__}: {e}")