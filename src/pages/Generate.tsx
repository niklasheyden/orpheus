import React, { useState, useRef } from 'react';
import { Upload, FileText, Users, Calendar, Hash, BookOpen, Loader2, Sparkles, X, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';
import { StorageError } from '@supabase/storage-js';
import { useToast } from '../components/Toast';
import GenerationProgressModal from '../components/GenerationProgressModal';
import { RESEARCH_FIELDS, RESEARCH_FIELD_CATEGORIES } from '../lib/constants';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const Generate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStage, setCurrentStage] = useState<'image' | 'script' | 'audio' | 'complete'>('image');
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    authors: '',
    publishingYear: new Date().getFullYear().toString(),
    fieldOfResearch: '',
    keywords: '',
    doi: '',
    isPublic: true
  });

  const researchFields = RESEARCH_FIELDS.map(field => field.name);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const checkStorageBucket = async (retries = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Attempt ${attempt}: Checking storage bucket access...`);
        
        const { data, error } = await supabase.storage
          .from('podcasts')
          .list('', {
            limit: 1
          });

        if (error) {
          console.error(`Attempt ${attempt}: Failed to access bucket:`, error);
          
          if (attempt === retries) {
            throw new Error(
              'Storage bucket "podcasts" not found or not accessible. Please verify:\n\n' +
              '1. The bucket "podcasts" exists in your Supabase project\n' +
              '2. The bucket is set to public\n' +
              '3. Your authentication token has the correct permissions\n' +
              '4. The bucket name is exactly "podcasts" (case-sensitive)\n\n' +
              `If the issue persists, please contact support with error code: ${error.message}`
            );
          }
          await delay(RETRY_DELAY);
          continue;
        }

        console.log('Successfully accessed podcasts bucket');
        return true;
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Attempt ${attempt}: Error:`, error);
          if (attempt === retries) {
            throw error;
          }
        }
        await delay(RETRY_DELAY);
      }
    }
    return false;
  };

  const saveImageToSupabase = async (imageUrl: string, userId: string): Promise<string> => {
    try {
      // Fetch the image through our Edge Function to avoid CORS
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch image: ${errorData.error || response.statusText}`);
      }

      const imageBlob = await response.blob();

      // Generate a unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = `${userId}/covers/${timestamp}-${randomString}.png`;

      // Upload to Supabase Storage with retry logic
      let uploadAttempt = 0;
      let uploadSuccess = false;
      let lastError: StorageError | null = null;

      while (uploadAttempt < MAX_RETRIES && !uploadSuccess) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('podcasts')
            .upload(filename, imageBlob, {
              contentType: 'image/png',
              cacheControl: '31536000',
              upsert: false
            });

          if (uploadError) {
            lastError = uploadError;
            uploadAttempt++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * uploadAttempt));
            continue;
          }

          uploadSuccess = true;
        } catch (error) {
          if (error instanceof StorageError) {
            lastError = error;
          }
          uploadAttempt++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * uploadAttempt));
        }
      }

      if (!uploadSuccess) {
        throw new Error(`Failed to upload image after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`);
      }

      // Get the public URL using the newer format
      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/podcasts/${filename}`;
      
      // Verify the image is accessible
      const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!verifyResponse.ok) {
        throw new Error('Failed to verify image accessibility');
      }

      return publicUrl;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error saving image:', error);
        throw new Error(`Failed to save cover image: ${error.message}`);
      }
      throw new Error('Failed to save cover image: Unknown error');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
        try {
          const text = await extractTextFromPdf(selectedFile);
          setPdfText(text);
        } catch (err: any) {
          console.error('Error extracting text from PDF:', err);
          setError(`Failed to extract text from PDF: ${err.message || 'Please try again'}`);
        }
        // Reset the input to allow selecting the same file again
        event.target.value = '';
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
      try {
        const text = await extractTextFromPdf(droppedFile);
        setPdfText(text);
      } catch (err) {
        console.error('Error extracting text from PDF:', err);
        setError('Failed to extract text from PDF. Please try again.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateCoverImagePrompt = async (title: string, abstract: string, keywords: string) => {
    try {
      // First, get key concepts and visual elements from the paper
      const conceptsCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting key visual concepts from academic papers and converting them into clear, concrete imagery. Focus on the main themes, methods, and outcomes that can be represented visually."
          },
          {
            role: "user",
            content: `Extract the key idea from this research paper that could be represented in an image. Focus on concrete, visual elements, not abstract concepts.

Title: ${title}
Abstract: ${abstract}
Keywords: ${keywords}

Format your response as a comma-separated list of visual elements, being as specific as possible.`
          }
        ],
        max_tokens: 150
      });

      const visualConcepts = conceptsCompletion.choices[0].message.content || '';

      // Then, create a detailed DALL-E prompt using these concepts
      const promptCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating detailed, specific prompts for DALL-E to generate research paper cover images. Create prompts that are concrete and specific, focusing on visual elements while maintaining a professional, academic aesthetic."
          },
          {
            role: "user",
            content: `Create a detailed DALL-E prompt for a research paper cover image. The image should be professional and suitable for an academic context.

Title: ${title}
Keywords: ${keywords}
Key Visual Concepts: ${visualConcepts}

Requirements:
- Start with the art style/medium
- Include specific visual elements
- Maintain academic professionalism
- Avoid abstract concepts unless they can be represented visually
- Include color scheme suggestions
- Specify composition preferences

Format: Single paragraph, detailed description`
          }
        ],
        max_tokens: 200
      });

      return promptCompletion.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating image prompt:', error);
      return `Create a professional, abstract cover image for a research paper titled "${title}" with keywords ${keywords}. The image should be modern, clean, and suitable for a podcast cover.`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setCurrentStage('image');

    try {
      // Generate cover image
      setProgress(10);
      const imagePrompt = await generateCoverImagePrompt(
        formData.title,
        formData.abstract,
        formData.keywords
      );

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
        n: 1,
      });

      const tempImageUrl = imageResponse.data[0].url;
      if (!tempImageUrl) {
        throw new Error('Failed to generate cover image');
      }

      setProgress(30);
      const coverImageUrl = await saveImageToSupabase(tempImageUrl, user!.id);

      // Generate script
      setCurrentStage('script');
      setProgress(40);
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert podcast host who specializes in making academic research accessible and engaging. Your style is conversational yet professional, focusing on clear and objective presentation of research findings. You must avoid sensational language, intense adjectives, or hyperbolic claims. Specifically, never use words like 'groundbreaking', 'exceptional', 'intriguing', 'revolutionary', 'amazing', 'incredible', 'remarkable', 'outstanding', 'brilliant', or similar hyperbolic terms. Instead, present research in a balanced, evidence-based manner using precise, measured language. You never use formal section headers or academic jargon without explanation. You never read abbreviations in parentheses - instead, you naturally incorporate the full terms into your speech. Your tone is measured, precise, and maintains academic rigor while being accessible. When mentioning authors, only name the lead author and refer to others as colleagues."
          },
          {
            role: "user",
            content: `Create a natural-sounding podcast script (between 6000-7000 characters) for the following research paper:
              Title: ${formData.title}
              Abstract: ${formData.abstract}
              Authors: ${formData.authors}
              Keywords: ${formData.keywords}
              
              Full Paper Text:
              ${pdfText}
              
              Guidelines for the script:
              1. Start with a professional welcome: "Welcome to a new episode of Orpheus!"
              2. Introduce the paper and authors in a clear, objective manner:
                 - If there is only one author, name the author 
                 - If there are exactly two authors, name both authors
                 - If there are more than two authors, name only the lead author (first author) and refer to others as "colleagues" or "co-authors"
                 - Do not list all authors by name
              3. Explain the research area using precise, accessible language
              4. Present the research findings in a flowing narrative without section headers
              5. Use natural transitions between topics
              6. Explain any technical terms or abbreviations the first time they appear
              7. Never read abbreviations in parentheses - use the full terms
              8. End with a balanced conclusion that summarizes key findings
              9. Close with a measured assessment of the research's implications
              
              Remember: 
              - The script should be between 6000-7000 characters total for a 5-7 minute podcast
              - Make it sound like a professional host speaking naturally, not reading from an academic paper
              - Avoid sensational language, intense adjectives, or hyperbolic claims
              - Never use words like 'groundbreaking', 'exceptional', 'intriguing', 'revolutionary', 'amazing', 'incredible', 'remarkable', 'outstanding', 'brilliant', or similar hyperbolic terms
              - Present findings in a balanced, evidence-based manner
              - Focus on clarity and objectivity rather than dramatic impact
              - Use precise, measured language to describe research outcomes
              - If you need to emphasize importance, use specific data or evidence rather than intense adjectives
              - Only name the lead author and refer to others as colleagues`
          }
        ]
      });

      const script = completion.choices[0].message.content;
      if (!script) {
        throw new Error('Failed to generate script');
      }

      if (script.length > 8000) {
        throw new Error('Generated script is too long for text-to-speech conversion. Please try again.');
      }

      // Generate audio
      setCurrentStage('audio');
      setProgress(70);
      const speechResponse = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "echo",
        input: script,
        instructions: "Speak in a engaging and positive, yet professsional tone that is appealing to an academic audience.",
      });

      const audioBlob = await speechResponse.blob();
      
      // Upload audio file
      const audioFileName = `${user!.id}/${Date.now()}-podcast-audio.mp3`;
      const { data: audioData, error: audioUploadError } = await supabase.storage
        .from('podcasts')
        .upload(audioFileName, audioBlob, {
          contentType: 'audio/mpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (audioUploadError) {
        throw new Error(`Failed to upload audio file: ${audioUploadError.message}`);
      }

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('podcasts')
        .getPublicUrl(audioFileName);

      if (!audioUrl) {
        throw new Error('Failed to generate public URL for audio file');
      }

      // Save podcast
      setCurrentStage('complete');
      setProgress(90);
      const { data: podcastData, error: podcastError } = await supabase
        .from('podcasts')
        .insert([
          {
            title: formData.title,
            abstract: formData.abstract,
            authors: formData.authors,
            publishing_year: parseInt(formData.publishingYear),
            field_of_research: formData.fieldOfResearch,
            doi: formData.doi || null,
            keywords: formData.keywords,
            cover_image_url: coverImageUrl,
            audio_url: audioUrl,
            script: script,
            user_id: user!.id,
            is_public: formData.isPublic
          }
        ])
        .select()
        .single();

      if (podcastError) {
        throw new Error(`Failed to save podcast: ${podcastError.message}`);
      }

      setProgress(100);
      showToast('Podcast generated successfully!');
      navigate(`/podcast/${podcastData.id}`);
    } catch (error: any) {
      console.error('Error generating podcast:', error);
      setError(error.message || 'Failed to generate podcast');
      showToast('Failed to generate podcast');
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => currentYear - i);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-6">
            <h1 className="font-display text-4xl font-medium text-white sm:text-5xl">
              Generate Podcast
            </h1>
            <p className="text-lg text-slate-400">
              Transform your research paper into an engaging audio experience. Upload your PDF and let AI do the magic.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* PDF Upload Section */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Upload Research Paper</h3>
                    <p className="text-sm text-slate-400">Upload your PDF file to get started</p>
                  </div>
                </div>

                <div
                  className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer ${
                    isDragging
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/5'
                      : file
                      ? 'border-fuchsia-500/30 bg-fuchsia-500/5'
                      : 'border-slate-700/50 bg-slate-800/50'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className={`rounded-full p-3 ${
                        file ? 'bg-fuchsia-500/10' : 'bg-slate-700/50'
                      }`}>
                        <Upload className={`w-6 h-6 ${
                          file ? 'text-fuchsia-400' : 'text-slate-400'
                        }`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">
                        {file ? (
                          <span className="text-fuchsia-400">File selected! Click to change</span>
                        ) : (
                          <span>Drag and drop your PDF file here, or click to browse</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        Only PDF files are supported
                      </p>
                    </div>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPdfText(null);
                      }}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Podcast Details</h3>
                    <p className="text-sm text-slate-400">Fill in the details about your research</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                          placeholder="Enter the title of your research"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Abstract
                        </label>
                        <textarea
                          name="abstract"
                          value={formData.abstract}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                          placeholder="Enter the abstract of your research"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Authors
                        </label>
                        <input
                          type="text"
                          name="authors"
                          value={formData.authors}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                          placeholder="Enter the authors' names"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Research Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-300">Research Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Publishing Year
                        </label>
                        <select
                          name="publishingYear"
                          value={formData.publishingYear}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                          required
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Research Field
                        </label>
                        <select
                          name="fieldOfResearch"
                          value={formData.fieldOfResearch}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                          required
                        >
                          <option value="">Select a field</option>
                          {RESEARCH_FIELDS.map((field) => (
                            <option key={field.id} value={field.name}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Keywords
                      </label>
                      <input
                        type="text"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                        placeholder="Enter keywords separated by commas"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        DOI (Optional)
                      </label>
                      <input
                        type="text"
                        name="doi"
                        value={formData.doi}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                        placeholder="Enter the DOI of your research"
                      />
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-300">Privacy Settings</h4>
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-3">
                          {formData.isPublic ? (
                            <Globe className="w-5 h-5 text-fuchsia-400" />
                          ) : (
                            <Lock className="w-5 h-5 text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {formData.isPublic ? 'Public Podcast' : 'Private Podcast'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formData.isPublic
                                ? 'Anyone can discover and listen to your podcast'
                                : 'Only you can see and access this podcast'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                          className={`
                            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50
                            ${formData.isPublic ? 'bg-fuchsia-500' : 'bg-slate-700'}
                          `}
                        >
                          <span
                            className={`
                              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                              transition duration-200 ease-in-out
                              ${formData.isPublic ? 'translate-x-5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      </div>
                      {formData.isPublic && (
                        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <div className="flex-shrink-0 mt-1">
                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-amber-400">
                              <strong>Legal Notice:</strong> You can only make your podcast public if you are an author of the uploaded research paper. Making public podcasts from papers you did not author may violate intellectual property rights.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating || !file}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3
                      ${isGenerating || !file
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/50'
                      }
                      transition-all duration-200
                    `}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Podcast</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GenerationProgressModal
        isOpen={isGenerating}
        progress={progress}
        currentStage={currentStage}
      />
    </div>
  );
};

export default Generate;