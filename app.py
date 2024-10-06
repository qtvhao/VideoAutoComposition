# from src.intro import intro
from src.composite import simple
from src.captions import one_at_a_time
import time
import sys
import json
import random
import os
import shutil

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
    job_json_file = argv[2]
    job_json = open(job_json_file, "r").read()
    job = json.loads(job_json)
    numberthOfParagraph = job["numberthOfParagraph"]
    paragraph = job["videoScript"][numberthOfParagraph]
    if "subtitle" in paragraph: # if paragraph has subtitle, set it to subtitle
        subtitle = paragraph["subtitle"]
    sanitizedBaseDirectory = paragraph["sanitizedBaseDirectory"] + "/"
    audio_file = paragraph["audioFilePath"]
    engine = "simple"
    # print(f"job: {job}")
    jobId = "" + paragraph["jobId"]

    composite_sequences = "/app/storage/images/composite-sequences/"
    if not os.path.exists(composite_sequences):
        os.makedirs(composite_sequences)

    output_file = composite_sequences + "composite-" + engine + "-" + jobId + ".mp4"
    print(f"route: {route}")
    print(f"engine: {engine}")
    print(f"output_file: {output_file}")
    print(f"audio_file: {audio_file}")
    randomId = random.randbytes(8).hex()
    addedBy = job["article"]["addedBy"]
    if route == "merge":
        if engine == "simple":
            sequences = job["videoScript"]
            sequence_result_paths = [sequence['sequence_result_path'] for sequence in job["videoScript"]]
            print(f"sequence_result_paths: {sequence_result_paths}")
            copied_composite_base_directory = f"/tmp/composite-{randomId}/"
            os.makedirs(copied_composite_base_directory)
            tmp_output_file = f"/tmp/composite-{randomId}.mp4"
            copied_composite_files = []
            for sequence_result_path in sequence_result_paths:
                copied_composite_file = copied_composite_base_directory + os.path.basename(sequence_result_path)
                copied_composite_files.append(copied_composite_file)
                shutil.copyfile(sequence_result_path, copied_composite_file)

#            is_sequence_exists = output_file exists
            if os.path.exists(output_file):
                print(f"output_file exists: {output_file}")
                returnvalue({
                    "merged": output_file
                })
            simple.simple_merge(copied_composite_files, tmp_output_file)
            shutil.copyfile(tmp_output_file, output_file)
            print(f"Copied {tmp_output_file} to {output_file}")
            shutil.rmtree(copied_composite_base_directory)
            os.remove(tmp_output_file)

            returnvalue({
                #"composite": "/tmp/merge-" + randomId + ".mp4",
                "merged": output_file
            })


    if route == "composite":
        if engine == "simple":
            started_at = time.time()
            randomId = random.randbytes(8).hex()
            copied_sanitized_base_directory = f"/tmp/sanitized-{randomId}/"
            os.makedirs(copied_sanitized_base_directory)
            copied_audio_file = f"/tmp/audio-{randomId}.mp3"
            tmp_output_file = f"/tmp/composite-{randomId}.mp4"
            tmp_output_file_captioned = f"/tmp/composite-captioned-{randomId}.mp4"
            os.system(f"cp {audio_file} {copied_audio_file}")
            sanitizedFiles = os.listdir(sanitizedBaseDirectory)
            for sanitizedFile in sanitizedFiles:
                if not sanitizedFile.endswith("blur.mp4"):
                    print(f"Copying {sanitizedBaseDirectory + sanitizedFile} to {copied_sanitized_base_directory + sanitizedFile}")
                    shutil.copyfile(sanitizedBaseDirectory + sanitizedFile, copied_sanitized_base_directory + sanitizedFile)
            copied_sanitized_base_directory_time = time.time() - started_at
            print(f"time: Copied sanitized in {copied_sanitized_base_directory_time} seconds")
            # os.system(f"cp -r {sanitizedBaseDirectory} {copied_sanitized_base_directory}")

            fps = 60
            preset = "medium"
            if addedBy == "video-prompt-queue":
                fps = 30
            if addedBy == "video-prompt-queue":
                preset = "veryfast"
            simple.simple_composite(copied_sanitized_base_directory, copied_audio_file, tmp_output_file, fps, preset)
            composite_time = time.time() - started_at - copied_sanitized_base_directory_time
            print(f"time: Composite time: {composite_time}")
            one_at_a_time.one_word_at_a_time(subtitle, copied_audio_file, tmp_output_file, tmp_output_file_captioned)
            caption_time = time.time() - started_at - composite_time - copied_sanitized_base_directory_time
            print(f"time: Caption time: {caption_time}")
            shutil.copyfile(tmp_output_file_captioned, output_file)
            print(f"Copied {tmp_output_file_captioned} to {output_file}")
            # clean up
            # . venv/bin/activate; python3 app.py composite /tmp/job-*
            shutil.rmtree(copied_sanitized_base_directory)
            os.remove(copied_audio_file)
            os.remove(tmp_output_file)

            returnvalue({
                "composite": "/tmp/composite-" + randomId + ".mp4",
                "caption": output_file
            })
