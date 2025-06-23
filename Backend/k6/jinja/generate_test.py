import json
from jinja2 import Environment, FileSystemLoader

# Load the config.json
with open('config.json') as f:
    config = json.load(f)

# Prepare the environment
env = Environment(
    loader=FileSystemLoader('.'),
    trim_blocks=True,
    lstrip_blocks=True
)

# Load the template
template = env.get_template('template.j2')  # your jinja template filename

# Render the template with the config data
# rendered = template.render(
#     stages=config['stages'],
#     test_cases=config['test_cases']
# )
rendered = template.render(tests=config["test_cases"], stages=config.get("stages", []))  # ✅


# Write the rendered JS to a file
with open('generated_test.js', 'w') as f:
    f.write(rendered)

print("✅ Test script generated successfully!")
