"""
Interactive CLI Tester for Healthcare Assistant.
Allows you to directly type queries in the terminal and see the full input/output.
"""

import os
import sys
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from rag.rag_engine import rag_engine

def run_interactive_cli():
    print("=" * 65)
    print("🏥 SIH HEALTHCARE AI ASSISTANT - INTERACTIVE TEST CONSOLE")
    print("=" * 65)
    print("તમે નીચે આપેલા કોઈપણ પ્રશ્ન પૂછી શકો છો:")
    print("1. Medicine stock: 'Which medicine is available for fever in Rajkot?'")
    print("2. Hospital info : 'Which hospital is in Gondal and what are the hours?'")
    print("3. Services      : 'Which hospital provides Maternal Care in Rajkot?'")
    print("4. Symptoms (ML) : 'I have high fever, severe headache, and nausea'")
    print("5. Patient EHR   : 'What chronic conditions does PAT-1001 have?'")
    print("6. Emergency     : 'Severe chest pain radiating to arm and cannot breathe'")
    print("\nType 'exit' or 'quit' to close.\n" + "-" * 65)

    while True:
        try:
            query = input("\n👉 તમારો પ્રશ્ન (Input): ").strip()
            if not query:
                continue
            if query.lower() in ["exit", "quit", "q"]:
                print("Exiting test console. Goodbye!")
                break

            print("\n⏳ Processing query through NLP -> MongoDB/ML -> Gemini...")
            response = rag_engine.generate_response(user_query=query)

            print("\n" + "=" * 65)
            print("📋 OUTPUT (Structured Response):")
            print("=" * 65)
            print(response["answer"])
            print("-" * 65)
            print(f"🔹 Detected Intent    : {response['intent']}")
            print(f"🔹 Emergency Flag     : {response['is_emergency']}")
            print(f"🔹 Data Sources (RAG) : {response['sources']}")
            print(f"🔹 Response Latency   : {response['latency_ms']} ms")
            print("=" * 65)

        except KeyboardInterrupt:
            print("\nExiting test console.")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    run_interactive_cli()
