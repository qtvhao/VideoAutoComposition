import moviepy.editor as moviepy
import os
from typing import List

output_folder = "/app/assets/outputs/"
if not os.path.exists(output_folder):
    os.makedirs(output_folder)
def combine_videos(combined_video_path: str,
                   video_paths: List[str],
                   audio_file: str,
                #    video_aspect: VideoAspect = VideoAspect.portrait,
                #    video_concat_mode: VideoConcatMode = VideoConcatMode.random,
                   max_clip_duration: int = 5,
                   threads: int = 2,
                   ) -> str:
    audio_clip = moviepy.AudioFileClip(audio_file)
    audio_duration = audio_clip.duration
    print(f"max duration of audio: {audio_duration} seconds")
    # Required duration of each clip
    req_dur = audio_duration / len(video_paths)
    req_dur = max_clip_duration
    print(f"each clip will be maximum {req_dur} seconds long")
    output_dir = os.path.dirname(combined_video_path)

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
            clip = moviepy.VideoFileClip(video_path).without_audio()
            # Check if clip is longer than the remaining audio
            if (audio_duration - video_duration) < clip.duration:
                clip = clip.subclip(0, (audio_duration - video_duration))
            # Only shorten clips if the calculated clip length (req_dur) is shorter than the actual clip to prevent still image
            elif req_dur < clip.duration:
                clip = clip.subclip(0, req_dur)
            clip = clip.set_fps(30)

            # Not all videos are same size, so we need to resize them
            clip_w, clip_h = clip.size
            if clip_w != video_width or clip_h != video_height:
                clip_ratio = clip.w / clip.h
                video_ratio = video_width / video_height

                if clip_ratio == video_ratio:
                    # 等比例缩放
                    clip = clip.resize((video_width, video_height))
                else:
                    # 等比缩放视频
                    if clip_ratio > video_ratio:
                        # 按照目标宽度等比缩放
                        scale_factor = video_width / clip_w
                    else:
                        # 按照目标高度等比缩放
                        scale_factor = video_height / clip_h

                    new_width = int(clip_w * scale_factor)
                    new_height = int(clip_h * scale_factor)
                    clip_resized = clip.resize(newsize=(new_width, new_height))

                    background = moviepy.ColorClip(size=(video_width, video_height), color=(0, 0, 0))
                    clip = moviepy.CompositeVideoClip([
                        background.set_duration(clip.duration),
                        clip_resized.set_position("center")
                    ])

                print(f"resizing video to {video_width} x {video_height}, clip size: {clip_w} x {clip_h}")

            if clip.duration > max_clip_duration:
                clip = clip.subclip(0, max_clip_duration)

            clips.append(clip)
            video_duration += clip.duration

    video_clip = moviepy.concatenate_videoclips(clips)
    video_clip = video_clip.set_fps(30)
    print(f"writing")
    # https://github.com/harry0703/MoneyPrinterTurbo/issues/111#issuecomment-2032354030
    video_clip.write_videofile(filename=combined_video_path,
                               threads=threads,
                               logger=None,
                               temp_audiofile_path=output_dir,
                               audio_codec="aac",
                               fps=30,
                               )
    video_clip.close()
    print(f"completed")
    return combined_video_path


def simple_composite(image_dir, audio_dir):
    images_files = [f for f in os.listdir(image_dir) if f.endswith('.mp4')]
    print(images_files)

    audio_file = [f for f in os.listdir(audio_dir) if f.endswith('.mp3')][0]
    print(audio_file)
    
    audio_duration = moviepy.AudioFileClip(audio_dir + audio_file).duration

    print("Duration", audio_duration)
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
    output_file = output_folder + "output-concat.mp4"
    print(combine_videos(output_file, [image_dir + image_file for image_file in images_files], audio_dir + audio_file))
    # final_clip.write_videofile(output_file, codec="libx264", audio_codec="aac")
    print("Done")
