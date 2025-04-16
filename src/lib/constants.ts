import { 
  Cpu, 
  Brain, 
  Database, 
  Bot, 
  Users, 
  Atom, 
  Beaker, 
  Leaf, 
  Dna, 
  Heart, 
  Brain as BrainIcon, 
  UserCog, 
  LineChart, 
  Users as UsersIcon, 
  Book, 
  History, 
  BookOpen as BookOpenIcon, 
  Zap, 
  Wrench, 
  Stethoscope, 
  Briefcase, 
  DollarSign,
  GraduationCap,
  Scale,
  Globe2,
  Building2,
  BarChart3,
  FileText,
  Languages,
  Microscope,
  Hammer,
  Network
} from 'lucide-react';

export interface ResearchField {
  id: string;
  name: string;
  icon: any;
  category: string;
}

export const RESEARCH_FIELDS: ResearchField[] = [
  // Computer Science & Technology
  { id: 'computer-science', name: 'Computer Science', icon: Cpu, category: 'Computer Science & Technology' },
  { id: 'artificial-intelligence', name: 'Artificial Intelligence', icon: Brain, category: 'Computer Science & Technology' },
  { id: 'data-science', name: 'Data Science', icon: Database, category: 'Computer Science & Technology' },
  { id: 'robotics', name: 'Robotics', icon: Bot, category: 'Computer Science & Technology' },
  { id: 'human-computer-interaction', name: 'Human-Computer Interaction', icon: Users, category: 'Computer Science & Technology' },
  { id: 'information-systems', name: 'Information Systems', icon: Network, category: 'Computer Science & Technology' },
  
  // Physical Sciences
  { id: 'physics', name: 'Physics', icon: Atom, category: 'Physical Sciences' },
  { id: 'chemistry', name: 'Chemistry', icon: Beaker, category: 'Physical Sciences' },
  { id: 'environmental-science', name: 'Environmental Science', icon: Leaf, category: 'Physical Sciences' },
  { id: 'materials-science', name: 'Materials Science', icon: Microscope, category: 'Physical Sciences' },
  
  // Life Sciences
  { id: 'biology', name: 'Biology', icon: Dna, category: 'Life Sciences' },
  { id: 'medicine', name: 'Medicine', icon: Heart, category: 'Life Sciences' },
  { id: 'neuroscience', name: 'Neuroscience', icon: BrainIcon, category: 'Life Sciences' },
  
  // Social Sciences
  { id: 'psychology', name: 'Psychology', icon: UserCog, category: 'Social Sciences' },
  { id: 'economics', name: 'Economics', icon: LineChart, category: 'Social Sciences' },
  { id: 'sociology', name: 'Sociology', icon: UsersIcon, category: 'Social Sciences' },
  { id: 'political-science', name: 'Political Science', icon: Scale, category: 'Social Sciences' },
  { id: 'anthropology', name: 'Anthropology', icon: Globe2, category: 'Social Sciences' },
  { id: 'education', name: 'Education', icon: GraduationCap, category: 'Social Sciences' },
  { id: 'urban-studies', name: 'Urban Studies', icon: Building2, category: 'Social Sciences' },
  
  // Humanities
  { id: 'archaeology', name: 'Archaeology', icon: Hammer, category: 'Humanities' },
  { id: 'philosophy', name: 'Philosophy', icon: Book, category: 'Humanities' },
  { id: 'history', name: 'History', icon: History, category: 'Humanities' },
  { id: 'literature', name: 'Literature', icon: BookOpenIcon, category: 'Humanities' },
  { id: 'linguistics', name: 'Linguistics', icon: Languages, category: 'Humanities' },
  { id: 'cultural-studies', name: 'Cultural Studies', icon: FileText, category: 'Humanities' },
  
  // Engineering
  { id: 'electrical-engineering', name: 'Electrical Engineering', icon: Zap, category: 'Engineering' },
  { id: 'mechanical-engineering', name: 'Mechanical Engineering', icon: Wrench, category: 'Engineering' },
  { id: 'biomedical-engineering', name: 'Biomedical Engineering', icon: Stethoscope, category: 'Engineering' },
  
  // Business & Management
  { id: 'business-administration', name: 'Business Administration', icon: Briefcase, category: 'Business & Management' },
  { id: 'finance', name: 'Finance', icon: DollarSign, category: 'Business & Management' },
  { id: 'marketing', name: 'Marketing', icon: BarChart3, category: 'Business & Management' }
];

export const RESEARCH_FIELD_CATEGORIES = [
  'Computer Science & Technology',
  'Physical Sciences',
  'Life Sciences',
  'Social Sciences',
  'Humanities',
  'Engineering',
  'Business & Management'
]; 