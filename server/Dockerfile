# Use the official Python image as a base
FROM python:3.10

# Conventional working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc libgl1-mesa-glx libglib2.0-0 ffmpeg libsm6 libxext6

# Install Poetry
RUN pip install poetry

# Copy over entire folder before installing deps
# (I know this is bad practice due to layer caching, but
# I'll gladly trade that optimization for peace of mind.
# Poetry and Docker are wacky)
COPY . .

# Install the dependencies
RUN poetry install

# Expose the port that app will run on
EXPOSE 10000

# Set the entry command for the container
CMD ["poetry", "run", "gunicorn", "-w", "1", "-b", "0.0.0.0:10000", "main:app"]
