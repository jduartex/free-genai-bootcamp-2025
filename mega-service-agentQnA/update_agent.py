import os
import re

# Install the domain adapter
os.system('cp crag_domain_adapter.py /app/crag_domain_adapter.py')

# Update main.py to use the adapter
main_file = '/app/main.py'
with open(main_file, 'r') as f:
    content = f.read()

# Add import for our adapter
import_section_end = content.find('\n\n', content.find('import '))
if import_section_end > 0:
    updated_content = content[:import_section_end] + "\nimport crag_domain_adapter\n" + content[import_section_end:]
else:
    # Fallback to simple replacement
    updated_content = content.replace("import requests", "import requests\nimport crag_domain_adapter")

# Replace the API call with our adapter
api_call_pattern = r'response = requests\.post\([^)]+\)[^\n]+'
api_call_replacement = '''response_data = await crag_domain_adapter.api.ask(message)
            # Create a response object with our result
            class SimulatedResponse:
                def __init__(self, data):
                    self.status_code = 200 if data.get("status") != "error" else 500
                    self._data = data
                
                def json(self):
                    return {"response": self._data.get("response", "")}
                    
            response = SimulatedResponse(response_data)'''

if re.search(api_call_pattern, updated_content):
    updated_content = re.sub(api_call_pattern, api_call_replacement, updated_content)
else:
    # Fallback if the pattern isn't found
    updated_content = updated_content.replace(
        "response = requests.post(",
        "# Original API call replaced\n            " + api_call_replacement + "\n            #response = requests.post("
    )

# Write the updated content back
with open(main_file, 'w') as f:
    f.write(updated_content)

print("✅ Updated main.py to use the domain adapter")
