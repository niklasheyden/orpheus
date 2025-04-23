import React from 'react';
import { Loader2, Image, FileText, Mic, CheckCircle2, Sparkles } from 'lucide-react';

interface GenerationProgressModalProps {
  isOpen: boolean;
  progress: number;
  currentStage: 'image' | 'script' | 'summary' | 'audio' | 'complete';
}

const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({ isOpen, progress, currentStage }) => {
  if (!isOpen) return null;

  const stages = [
    {
      title: 'Identifying Key Insights',
      description: 'Analyzing your research to create a comprehensive AI summary',
      icon: Sparkles,
      stage: 'summary'
    },
    {
      title: 'Generating Cover Image',
      description: 'Creating a unique cover image for your podcast using AI',
      icon: Image,
      stage: 'image'
    },
    {
      title: 'Writing Podcast Script',
      description: 'Converting your research into an engaging podcast script',
      icon: FileText,
      stage: 'script'
    },
    {
      title: 'Creating Audio',
      description: 'Converting the script into high-quality audio narration',
      icon: Mic,
      stage: 'audio'
    },
    {
      title: 'Finalizing',
      description: 'Saving your podcast and preparing for playback',
      icon: CheckCircle2,
      stage: 'complete'
    }
  ];

  const currentStageIndex = stages.findIndex(stage => stage.stage === currentStage);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-lg w-full mx-4 border border-slate-700/50 shadow-xl">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-display font-medium text-white mb-2">
              Creating Your Podcast
            </h3>
            <p className="text-slate-400">
              This process may take a few minutes. Please don't close this window.
            </p>
          </div>

          <div className="space-y-4">
            {stages.map((stage, index) => {
              const isActive = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              const Icon = stage.icon;

              return (
                <div
                  key={stage.stage}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-fuchsia-500/10 border border-fuchsia-500/20'
                      : isCompleted
                      ? 'bg-slate-700/30 border border-slate-700/50'
                      : 'bg-slate-700/10 border border-slate-700/20'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-fuchsia-500/20 text-fuchsia-400'
                      : isCompleted
                      ? 'bg-slate-700/50 text-slate-300'
                      : 'bg-slate-700/30 text-slate-500'
                  }`}>
                    {isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${
                      isActive
                        ? 'text-fuchsia-400'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}>
                      {stage.title}
                    </h4>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-fuchsia-400">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-fuchsia-400">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-700/50">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-fuchsia-500 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationProgressModal; 