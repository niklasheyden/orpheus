import { 
  Cpu, 
  Brain, 
  Database, 
  Bot, 
  Eye, 
  Shield, 
  Code, 
  Users, 
  Database as DatabaseIcon, 
  Network, 
  Cloud, 
  Radio, 
  CircuitBoard, 
  Monitor, 
  Terminal, 
  BookOpen, 
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
  Car, 
  Stethoscope, 
  Briefcase, 
  DollarSign 
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
  { id: 'machine-learning', name: 'Machine Learning', icon: Brain, category: 'Computer Science & Technology' },
  { id: 'data-science', name: 'Data Science', icon: Database, category: 'Computer Science & Technology' },
  { id: 'robotics', name: 'Robotics', icon: Bot, category: 'Computer Science & Technology' },
  { id: 'computer-vision', name: 'Computer Vision', icon: Eye, category: 'Computer Science & Technology' },
  { id: 'natural-language-processing', name: 'Natural Language Processing', icon: BookOpen, category: 'Computer Science & Technology' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: Shield, category: 'Computer Science & Technology' },
  { id: 'software-engineering', name: 'Software Engineering', icon: Code, category: 'Computer Science & Technology' },
  { id: 'human-computer-interaction', name: 'Human-Computer Interaction', icon: Users, category: 'Computer Science & Technology' },
  { id: 'information-systems', name: 'Information Systems', icon: DatabaseIcon, category: 'Computer Science & Technology' },
  { id: 'computer-networks', name: 'Computer Networks', icon: Network, category: 'Computer Science & Technology' },
  { id: 'distributed-systems', name: 'Distributed Systems', icon: Cloud, category: 'Computer Science & Technology' },
  { id: 'cloud-computing', name: 'Cloud Computing', icon: Cloud, category: 'Computer Science & Technology' },
  { id: 'internet-of-things', name: 'Internet of Things', icon: Radio, category: 'Computer Science & Technology' },
  { id: 'embedded-systems', name: 'Embedded Systems', icon: CircuitBoard, category: 'Computer Science & Technology' },
  { id: 'computer-architecture', name: 'Computer Architecture', icon: Cpu, category: 'Computer Science & Technology' },
  { id: 'operating-systems', name: 'Operating Systems', icon: Monitor, category: 'Computer Science & Technology' },
  { id: 'programming-languages', name: 'Programming Languages', icon: Terminal, category: 'Computer Science & Technology' },
  { id: 'database-systems', name: 'Database Systems', icon: DatabaseIcon, category: 'Computer Science & Technology' },
  
  // Physical Sciences
  { id: 'physics', name: 'Physics', icon: Atom, category: 'Physical Sciences' },
  { id: 'chemistry', name: 'Chemistry', icon: Beaker, category: 'Physical Sciences' },
  { id: 'environmental-science', name: 'Environmental Science', icon: Leaf, category: 'Physical Sciences' },
  
  // Life Sciences
  { id: 'biology', name: 'Biology', icon: Dna, category: 'Life Sciences' },
  { id: 'medicine', name: 'Medicine', icon: Heart, category: 'Life Sciences' },
  { id: 'neuroscience', name: 'Neuroscience', icon: BrainIcon, category: 'Life Sciences' },
  
  // Social Sciences
  { id: 'psychology', name: 'Psychology', icon: UserCog, category: 'Social Sciences' },
  { id: 'economics', name: 'Economics', icon: LineChart, category: 'Social Sciences' },
  { id: 'sociology', name: 'Sociology', icon: UsersIcon, category: 'Social Sciences' },
  
  // Humanities
  { id: 'philosophy', name: 'Philosophy', icon: Book, category: 'Humanities' },
  { id: 'history', name: 'History', icon: History, category: 'Humanities' },
  { id: 'literature', name: 'Literature', icon: BookOpenIcon, category: 'Humanities' },
  
  // Engineering
  { id: 'electrical-engineering', name: 'Electrical Engineering', icon: Zap, category: 'Engineering' },
  { id: 'mechanical-engineering', name: 'Mechanical Engineering', icon: Wrench, category: 'Engineering' },
  { id: 'biomedical-engineering', name: 'Biomedical Engineering', icon: Stethoscope, category: 'Engineering' },
  
  // Business & Management
  { id: 'business-administration', name: 'Business Administration', icon: Briefcase, category: 'Business & Management' },
  { id: 'finance', name: 'Finance', icon: DollarSign, category: 'Business & Management' }
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