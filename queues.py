from bullmq import Queue

# Create a queue
queue = Queue("myQueue", connection=Redis())

async def add_job(job_name, job_data):
    await queue.add(job_name, job_data)
    await queue.close()
    return
