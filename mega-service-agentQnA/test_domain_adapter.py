#!/usr/bin/env python3
import asyncio
import json
import sys
from crag_domain_adapter import api

async def test_adapter():
    print("Testing CRAG Domain Adapter...")
    
    # Test queries for different domains
    test_queries = [
        "Who directed the movie Inception?",
        "What's the stock price of Apple?",
        "Who won the Grammy for Best New Artist in 2020?",
        "Which NBA team won the championship in 2021?",
        "Who is Albert Einstein?",
        "What can the CRAG API do?",
    ]
    
    for query in test_queries:
        print(f"\n\nTesting query: {query}")
        try:
            result = await api.ask(query)
            print(f"Domain: {api.determine_domain(query)}")
            print(f"Status: {result.get('status')}")
            print(f"Endpoint: {result.get('endpoint')}")
            print(f"Response: {result.get('response')[:200]}..." if len(result.get('response', '')) > 200 else result.get('response'))
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_adapter())
