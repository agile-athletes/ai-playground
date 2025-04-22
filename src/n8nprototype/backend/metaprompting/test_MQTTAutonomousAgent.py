#!/usr/bin/env python3
"""
Test für die Generierung von JavaScript-Code aus Prompt-Markdown-Dateien
"""
import json
import os
import base64
import unittest
import glob
from pathlib import Path


class TestPromptToJavaScript(unittest.TestCase):
    """Test zur Verarbeitung von Prompt-Dateien und Generierung von JavaScript"""
    
    def setUp(self):
        """Vorbereitung der Testumgebung"""
        # Verzeichnispfade festlegen
        self.base_dir = Path(__file__).parent
        self.prompt_dir = self.base_dir / "in"
        self.output_dir = self.base_dir / "out"
        self.sample_file = self.base_dir / "in" / "runOnceOverAllItemsSample.js"
        
        # Sicherstellen, dass die Verzeichnisse existieren
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Liste für die gesammelten Prompt-Daten
        self.prompt_data = []

    def test_generate_javascript_from_prompts(self):
        """Test zum Einlesen von Prompt-Dateien und Erzeugen von JavaScript-Code"""
        # Alle prompt-*.md Dateien finden
        prompt_files = sorted(glob.glob(str(self.prompt_dir / "prompt-*.md")))
        
        # Überprüfen, ob Prompt-Dateien gefunden wurden
        self.assertTrue(len(prompt_files) > 0, "Keine prompt-*.md Dateien gefunden")
        print(f"Gefundene Prompt-Dateien: {len(prompt_files)}")
        print(f"Dateipfade: {prompt_files}")
        
        # Durch alle Prompt-Dateien iterieren und Daten sammeln
        for prompt_file in prompt_files:
            print(f"Verarbeite Datei: {prompt_file}")
            
            # Datei lesen
            with open(prompt_file, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # JSON aus Markdown-Codeblock extrahieren
            json_content = self._extract_json_from_markdown(content)
            self.assertIsNotNone(json_content, f"Konnte kein JSON aus {prompt_file} extrahieren")
            
            # JSON parsen
            try:
                prompt_item = json.loads(json_content)
                
                # Base64-kodieren des ursprünglichen Prompts
                if "prompt" in prompt_item:
                    # Original-Prompt speichern
                    original_prompt = prompt_item["prompt"]
                    # Prompt base64-kodieren
                    prompt_item["prompt"] = base64.b64encode(original_prompt.encode('utf-8')).decode('utf-8')
                
                # Zum Datensatz hinzufügen
                self.prompt_data.append(prompt_item)
                
            except json.JSONDecodeError as e:
                self.fail(f"Fehler beim Parsen des JSON aus {prompt_file}: {e}")
        
        # JavaScript-Datei generieren
        output_file_path = self.output_dir / "generated_prompts.js"
        self._generate_javascript_file(output_file_path)
        
        # Überprüfen, ob die Datei erzeugt wurde
        self.assertTrue(output_file_path.exists(), f"Die Ausgabedatei {output_file_path} wurde nicht erstellt")
        
        # Ausgabedatei validieren
        with open(output_file_path, 'r', encoding='utf-8') as file:
            generated_js = file.read()
        
        # Überprüfen, ob die JavaScript-Datei gültig ist
        self.assertIn("const resultset =", generated_js, "JavaScript-Datei enthält nicht die erwartete resultset-Definition")
        self.assertIn("return resultset", generated_js, "JavaScript-Datei enthält nicht das erwartete return-Statement")
        
        # Überprüfen, ob alle Prompts als Base64 kodiert wurden
        for item in self.prompt_data:
            if "prompt" in item:
                self.assertIn(item["prompt"], generated_js, f"Base64-kodierter Prompt für {item.get('label', 'unbekannt')} nicht in der Ausgabedatei gefunden")
        
        print(f"JavaScript-Datei erfolgreich generiert: {output_file_path}")

    def _extract_json_from_markdown(self, markdown_content):
        """Extrahiert JSON aus einem Markdown-Codeblock"""
        import re
        # Regulärer Ausdruck zum Extrahieren des Inhalts zwischen Codeblock-Markierungen
        pattern = r"```(?:\w*\n|\n)(.*?)```"
        match = re.search(pattern, markdown_content, re.DOTALL)
        if match:
            return match.group(1).strip()
        return None

    def _generate_javascript_file(self, output_file_path):
        """Generiert eine JavaScript-Datei mit den gesammelten Prompt-Daten"""
        # JavaScript-Vorlage
        js_template = """const resultset = {0} return resultset"""
        
        # Formatieren der Daten als JavaScript-Array
        formatted_data = json.dumps(self.prompt_data, indent=2)
        
        # JavaScript-Code erstellen
        js_code = js_template.format(formatted_data)
        
        # Datei schreiben
        with open(output_file_path, 'w', encoding='utf-8') as file:
            file.write(js_code)


