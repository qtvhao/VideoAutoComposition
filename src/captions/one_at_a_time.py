import moviepy.editor as moviepy
import os
import json

# output_folder = "/app/assets/outputs/"
fps = 2

def one_word_at_a_time(subtitle, video_path, output_file):
    # 
    if isinstance(video_path, str):
        video = moviepy.VideoFileClip(video_path)
    else:
        video = video_path
    clips = [
        video
    ]
    reduced_text = ""
    marker_for_same_line = False
    marker_start = 0
    for line in subtitle:
        print(line)
        part = line['part']
        start = line['start'] / 1000
        end = line['end'] / 1000
        part_is_should_be_on_same_line = '"' in part or "'" in part or "(" in part or "[" in part or "{" in part or "<" in part
        if part_is_should_be_on_same_line and not marker_for_same_line:
            print("Part is should be on same line")
            reduced_text += part
            marker_start = start
            marker_for_same_line = True
            continue
        part_is_should_be_on_new_line = '"' in part or "'" in part or ")" in part or "]" in part or "}" in part or ">" in part
        if part_is_should_be_on_new_line:
            print("Part is should be on new line")
            marker_for_same_line = False
            # marker_end = end
            start = marker_start
            # end = marker_end
            part = reduced_text + " " + part
            reduced_text = ""
        else:
            if marker_for_same_line:
                print("Part is should be on same line")
                reduced_text = reduced_text + " " + part
                continue
        text_clip_params = {
            "txt": part,
            "fontsize": 70,
            "color": "#fffa00",
            "font": "DejaVu-Sans-Bold",
            "size": (1920, 1080),
            "kerning": 5,
            "method": "caption",
            # "align": "center",
            "fps": fps,
            "stroke_color": "black",
            "stroke_width": 1,
        }
        clip_info = {k: text_clip_params[k] for k in ('txt', 'fontsize', 'font', 'color', 'stroke_width', 'stroke_color', 'size', 'kerning', 'method', 'align') if k in text_clip_params}
        image_of_styled_text = moviepy.TextClip(**clip_info)
        image_of_styled_text = image_of_styled_text.set_start(start)
        image_of_styled_text = image_of_styled_text.set_end(end)
        image_of_styled_text = image_of_styled_text.set_duration(end-start)
        image_of_styled_text = image_of_styled_text.set_fps(fps)
        image_of_styled_text = image_of_styled_text.set_position("center", "bottom")
        clips.append(image_of_styled_text)
    video_clip = moviepy.CompositeVideoClip(clips)
    video_clip = video_clip.set_fps(fps)
    # output_file = output_folder + "output-one-word-at-a-time.mp4"
    video_clip.write_videofile(filename=output_file)
    video_clip.close()
    print("done")

    return output_file
    