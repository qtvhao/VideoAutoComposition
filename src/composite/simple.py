import moviepy.editor as moviepy
import os
import random
from typing import List
# import moviepy.video.fx.all as vfx
import cv2
# from skimage.filters import gaussian_filter
import skimage.filters as filters

logs_file = "/tmp/logs.txt"
output_folder = "/app/assets/outputs/"
fps = 1
if not os.path.exists(output_folder):
    os.makedirs(output_folder)
def log_color_clip(clip):
    return (f"Clip type: {type(clip)}, duration: {clip.duration}, size: {clip.size}, color: {clip.color}\n")
def has_filename(clip):
    try:
        return clip.filename
    except AttributeError:
        return False
def log_composte_clip(clip):
    clips_filenames = ""
    for c in clip.clips:
        if has_filename(c):
            clips_filenames += c.filename + ", "

    return (f"Clip type: {type(clip)}, duration: {clip.duration}, size: {clip.size}, path: {clips_filenames}\n")
# def log_video_clip(clip):
#     logs = open(logs_file, "w")
#     logs.write(f"Clip type: {type(clip)}, duration: {clip.duration}, size: {clip.size}, path: {clip.filename}\n")
#     logs.close()
# def log_image_clip(clip):
#     logs = open(logs_file, "w")
#     logs.write(f"Clip type: {type(clip)}, duration: {clip.duration}, size: {clip.size}, path: {clip.filename}\n")
#     logs.close()

def log_normal_clip(clip):
    return (f"Clip type: {type(clip)}, duration: {clip.duration}, size: {clip.size}, path: {clip.filename}\n")

def log_clip(clip):
    logs = open(logs_file, "w")
    match = {
        moviepy.VideoFileClip: log_normal_clip,
        moviepy.ImageClip: log_normal_clip,
        moviepy.TextClip: log_normal_clip,
        moviepy.ColorClip: log_color_clip,
        moviepy.CompositeVideoClip: log_composte_clip
    }
    print(f"Clip type: {type(clip)}")
    log_line = match[type(clip)](clip)
    logs.write(log_line)
    logs.close()
def slide_to(direction, slide_duration_in_ms, clip_w, clip_h, video_width, video_height):
    # From 2/3 of the video, slide to the 1/3 of the video
    # 
    startRightX = video_width * 2 / 3 - clip_w / 2
    endRightX = video_width * 1 / 3 - clip_w / 2
    startBottomY = video_height * 2 / 3 - clip_h / 2
    endBottomY = video_height * 1 / 3 - clip_h / 2
    startLeftX = video_width * 1 / 3
    endLeftX = video_width * 2 / 3
    startTopY = video_height * 1 / 3
    endTopY = video_height * 2 / 3
    # 
    startX = video_width / 2 - clip_w / 2
    endX = video_width / 2 - clip_w / 2
    startY = video_height / 2 - clip_h / 2
    endY = video_height / 2 - clip_h / 2
    if "left" in direction:
        startX = startRightX
        endX = endRightX
    if "right" in direction:
        startX = startLeftX
        endX = endLeftX
    if "top" in direction:
        startY = startBottomY
        endY = endBottomY
    if "bottom" in direction:
        startY = startTopY
        endY = endTopY

    duration_portion = 0.001 / slide_duration_in_ms
    gapX = endX - startX
    gapY = endY - startY
    direction_map = {
        # "left": lambda t: ( int((duration_portion / t * gapX + startX)), startY),
        "left": lambda t: ( int((startX + (endX - startX) * (t / (slide_duration_in_ms / 1000)))), startY),
        "right": lambda t: ( int((duration_portion / t * gapX + startX)), startY),
        "top": lambda t: ( startX, int((duration_portion / t * gapY + startY))),
        "bottom": lambda t: ( startX, int((duration_portion / t * gapY + startY))),
        "lefttop": lambda t: ( int((duration_portion / t * gapX + startX)), int((duration_portion / t * gapY + startY))),
        "leftbottom": lambda t: ( int((duration_portion / t * gapX + startX)), int((duration_portion / t * gapY + startY))),
        "righttop": lambda t: ( int((duration_portion / t * gapX + startX)), int((duration_portion / t * gapY + startY))),
        "rightbottom": lambda t: ( int((duration_portion / t * gapX + startX)), int((duration_portion / t * gapY + startY))),
    }
    return direction_map[direction]

def combine_videos(combined_video_path: str|bool,
                   video_paths: List[str],
                   audio_file: str,
                #    video_aspect: VideoAspect = VideoAspect.portrait,
                #    video_concat_mode: VideoConcatMode = VideoConcatMode.random,
                   max_clip_duration: int = 5,
                   threads: int = 2,
                   ) -> str:
    audio_clip = moviepy.AudioFileClip(audio_file)
    codec_name = "aac"
    if audio_file.endswith(".mp3"):
        codec_name = "libmp3lame"
    audio_duration = audio_clip.duration
    print(f"max duration of audio: {audio_duration} seconds")
    # Required duration of each clip
    req_dur = audio_duration / len(video_paths)
    req_dur = max_clip_duration
    print(f"each clip will be maximum {req_dur} seconds long")
    # output_dir = os.path.dirname(combined_video_path)

    # aspect = VideoAspect(video_aspect)
    video_width, video_height = 1920, 1080

    clips = []
    video_duration = 0
    # Add downloaded clips over and over until the duration of the audio (max_duration) has been reached
    while video_duration < audio_duration:
        # random video_paths order
        # if video_concat_mode.value == VideoConcatMode.random.value:
            # random.shuffle(video_paths)

        for video_path in video_paths:
            print(f"processing {video_path}")
            if video_duration >= audio_duration: # check if the video duration is greater than the audio duration
                print(f"video duration {video_duration} is greater than audio duration {audio_duration}, breaking loop")
                break
            clip = moviepy.VideoFileClip(video_path).without_audio()
            # Check if clip is longer than the remaining audio
            if (audio_duration - video_duration) < clip.duration:
                clip = clip.subclip(0, (audio_duration - video_duration))
            # Only shorten clips if the calculated clip length (req_dur) is shorter than the actual clip to prevent still image
            elif req_dur < clip.duration:
                clip = clip.subclip(0, req_dur)
            clip = clip.set_fps(fps)

            # Not all videos are same size, so we need to resize them
            clip_w, clip_h = clip.size
            if clip_w != video_width or clip_h != video_height:
                clip_ratio = clip.w / clip.h
                video_ratio = video_width / video_height
                if ((622 * 622) / (clip_w * clip_h)) > 1.25:
                    print(f"video {video_path} is too small ({clip_w} x {clip_h} = {clip_w * clip_h}) for {622} x {622} = {622 * 622}, ratio {(622 * 622) / (clip_w * clip_h)}")
                    continue
                print(f"video {video_path} is {clip_w} x {clip_h}, ratio ({(clip_w * clip_h) / (622 * 622)})")

                if clip_ratio == video_ratio:
                    # 等比例缩放
                    clip = clip.resize((video_width, video_height))
                else:
                    # 等比缩放视频
                    if clip_ratio > video_ratio:
                        # clip is wider than video, causing black bars on top and bottom
                        # must cover the whole video, so scale to the height
                        scale_factor = video_height / clip_h
                    else:
                        # clip is taller than video, causing black bars on left and right
                        # must cover the whole video, so scale to the width
                        scale_factor = video_width / clip_w

                    new_width = int(clip_w * scale_factor)
                    new_height = int(clip_h * scale_factor)
                    clip_resized = clip.resize(newsize=(new_width, new_height))
                    # 
                    clip_scale_factor = 1
                    if clip_h > video_height:
                        clip_scale_factor = clip_h / video_height
                        clip = clip.resize(newsize=(int(clip_w / clip_scale_factor), int(clip_h / clip_scale_factor)))
                    if clip_w > video_width:
                        clip_scale_factor = clip_w / video_width
                        clip = clip.resize(newsize=(int(clip_w / clip_scale_factor), int(clip_h / clip_scale_factor)))

                    def boxblur(input_frame):
                        return cv2.GaussianBlur(input_frame, (15, 15), 0)
                        # Use cv2 to apply a box blur to each frame
                        
                    clip_resized = clip_resized.fl_image(boxblur)

                    directions = [
                        "left", # "right", "top", "bottom",
                        # "lefttop", "leftbottom", "righttop", "rightbottom"
                    ]
                    random_direction = directions[random.randint(0, len(directions) - 1)]
                    print(f"random_direction: {random_direction}")
                    background = moviepy.ColorClip(size=(video_width, video_height), color=(0, 0, 0))
                    clip = moviepy.CompositeVideoClip([
                        background.set_duration(clip.duration),
                        clip_resized.set_position('center'),
                        clip.set_position(slide_to(random_direction, (clip.duration * 1000), clip_w / clip_scale_factor, clip_h / clip_scale_factor, video_width, video_height))
                    ])

                print(f"resizing video to {video_width} x {video_height}, clip size: {clip_w} x {clip_h}")

            if clip.duration > max_clip_duration:
                clip = clip.subclip(0, max_clip_duration)

            clips.append(clip)
            video_duration += clip.duration

    for clip in clips:
        log_clip(clip)
    video_clip = moviepy.concatenate_videoclips(clips)
    video_clip = video_clip.set_audio(audio_clip)
    video_clip = video_clip.set_fps(fps)
    print(f"writing")
    # https://github.com/harry0703/MoneyPrinterTurbo/issues/111#issuecomment-2032354030
    if not combined_video_path:
        return video_clip
    video_clip.write_videofile(filename=combined_video_path,
                               threads=threads,
                            #    temp_audiofile_path=output_dir,
                               audio_codec=codec_name,
                               fps=fps,
                               )
    video_clip.close()
    print(f"completed")

    return combined_video_path


def simple_composite(image_dir, audio_file, output_file):
    images_files = [f for f in os.listdir(image_dir) if f.endswith('.mp4')]
    print(images_files)

    # audio_file = [f for f in os.listdir(audio_dir) if f.endswith('.mp3')][0]
    # print(audio_file)
    
    # audio_duration = moviepy.AudioFileClip(audio_dir + "/" + audio_file).duration

    # print("Duration", audio_duration)
    # clips = []
    # final_duration = 0
    # for image_file in images_files:
    #     clip = moviepy.VideoFileClip(image_dir + image_file)
    #     final_duration += clip.duration
    #     clips.append(clip)
    #     if final_duration >= audio_duration:
    #         break

    # final_clip = moviepy.concatenate_videoclips(clips)
    # final_clip = final_clip.set_audio(moviepy.AudioFileClip(audio_dir + audio_file))
    return (combine_videos(output_file, [image_dir + image_file for image_file in images_files], audio_file))
    # final_clip.write_videofile(output_file, codec="libx264", audio_codec="aac")
    # print("Done")
