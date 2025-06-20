from jinja2 import Environment, FileSystemLoader
import json
import re

def main():
    with open("scenario.json") as f:
        data = json.load(f)

    env = Environment(loader=FileSystemLoader("."))
    env.filters["regex_replace"] = lambda s, pattern, repl: re.sub(pattern, repl, s)  # ✅ ADD THIS LINE

    template = env.get_template("template.j2")
    # rendered = template.render(tests=data["tests"])
    rendered = template.render(tests=data["test_cases"], stages=data.get("stages", []))


    with open("generated_test.js", "w") as f:
        f.write(rendered)

if __name__ == "__main__":
    main()
