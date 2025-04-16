#!/bin/bash

# Create the banners directory if it doesn't exist
mkdir -p public/images/banners

# Download and optimize banner images
# Using Unsplash for high-quality, free-to-use images

# Neural Network visualization
curl -L "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e" -o "public/images/banners/neurons.jpg"

# DNA Structure
curl -L "https://images.unsplash.com/photo-1530026405186-ed1f139313f8" -o "public/images/banners/dna.jpg"

# Deep Space Nebula
curl -L "https://images.unsplash.com/photo-1462331940025-496dfbfc7564" -o "public/images/banners/space.jpg"

# Molecular Structure
curl -L "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69" -o "public/images/banners/molecules.jpg"

# Optimize images
for img in public/images/banners/*.jpg; do
  convert "$img" -strip -quality 85 -resize "1920x1080^" -gravity center -extent 1920x1080 "$img"
done

echo "Banner images downloaded and optimized successfully!" 