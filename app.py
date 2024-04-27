# from src.intro import intro
from src.composite import simple
from src.captions import one_at_a_time
import sys
import json
import random

ASSETS_DIR = "/app/assets/"
SRC_DIR = "/app/src/"
TEMPLATES_DIR = "/app/templates/"

# template="Minimalist Line-based Economic News Intro"
# template_folder = TEMPLATES_DIR + template + "/"
def returnvalue(returnvalue_0):
    returnvalue_json = open("/tmp/returnvalue.json", "w")
    returnvalue_json.write(json.dumps(returnvalue_0))
    returnvalue_json.close()

if __name__ == "__main__":
    # simple()
    argv = sys.argv
    route = argv[1]
    engine = argv[2]
    output_file = argv[3]
    print(f"route: {route}")
    print(f"engine: {engine}")
    print(f"output_file: {output_file}")
    if route == "composite":
        if engine == "simple":
            randomId = random.randbytes(8).hex
            simple.simple_composite(ASSETS_DIR + "image", ASSETS_DIR + "audio", "/tmp/composite-" + randomId + ".mp4")
            one_at_a_time.one_word_at_a_time(ASSETS_DIR + "audio", "/tmp/composite-" + randomId + ".mp4", output_file)

            returnvalue({
                "composite": "/tmp/composite-" + randomId + ".mp4",
                "caption": output_file
            })
