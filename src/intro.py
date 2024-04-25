import os
import json
import shutil
import moviepy.editor as moviepy
import random
def intro(template_folder, placed_texts):
    mp4_file = [f for f in os.listdir(template_folder) if f.endswith('.mp4')][0]

    texts_config_file = template_folder + "texts.json"

    texts = {}
    if not os.path.exists(texts_config_file):
        texts = {}
        texts["texts"] = []
        texts["texts"].append({"text": "THIS MONDAY | 3:40 PM", "position": [125, 485], "timeline_cursor": 3.2, "height": 21, "text_color": "#ffffff"})
# 
        texts["texts"].append({"text": "@Kiến thức Sundayyyyyyyyy", "position": [125, 80], "timeline_cursor": 4.2, "height": 21, "text_color": "#ffffff"})
        texts["texts"].append({"text": "Accounting Management in Luong Binh", "position": [180, 129], "timeline_cursor": 1.2, "height": 60, "text_color": "#ffffff"})
        with open(texts_config_file, 'w') as outfile:
            json.dump(texts, outfile)
    else:
        with open(texts_config_file) as json_file:
            texts = json.load(json_file)
    # 

    output_folder = "/app/assets/outputs/"
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    random5 = ''.join(random.choices('0123456789', k=5))
    output_file = output_folder + "output_" + random5 + ".mp4"
    # Copy mp4 file to output_file
    shutil.copyfile(template_folder + mp4_file, output_file)
    # 
    for text in texts["texts"]:
        print(text["text"], text["position"], text["timeline_cursor"])
        text_content = text["text"]

        text_position = text["position"]
        timeline_cursor = text["timeline_cursor"]
        height = text["height"]
        text_color = text["text_color"]
        # 
        if height > 50:
            # Split words by space
            text_content = text_content.split(" ")
            # Chunk words by 3 words
            text_content = [text_content[i:i + 3] for i in range(0, len(text_content), 3)]
            # Join words by \n
            text_content = "\n".join([" ".join(text) for text in text_content])
        # 
        print("text_content", text_content)
        print("text_position", text_position)
        print("timeline_cursor", timeline_cursor)
        # 
        print("mp4_file", mp4_file)
        print("placed_texts", placed_texts)
        # Output /app/assets/outputs/
        random5 = ''.join(random.choices('0123456789', k=5))
        tmp_output_file = output_folder + "output_" + random5 + ".mp4"
        video = moviepy.VideoFileClip(output_file)
        #
        # Add text
        txt_clip = moviepy.TextClip(text_content, fontsize=height * 1.5, color=text_color, font="DejaVu-Sans-Bold", align='West')
        txt_clip = txt_clip.set_position([text_position[0], text_position[1] + height])
        video_duration_subtract_timeline_cursor = video.duration - timeline_cursor
        txt_clip = txt_clip.set_duration(video_duration_subtract_timeline_cursor)
        print("duration", video.duration)
        txt_clip = txt_clip.set_start(timeline_cursor)
        video = moviepy.CompositeVideoClip([video, txt_clip])
        # Write the result to a file with loggers
        video.write_videofile(tmp_output_file, codec='libx264', fps=24, threads=4)
        shutil.move(tmp_output_file, output_file)

        print("output_file", output_file)

