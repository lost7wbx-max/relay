/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Settings, 
  Plus, 
  Search, 
  RefreshCw,
  MoreVertical, 
  ShieldCheck, 
  Archive, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  Zap, 
  CreditCard, 
  ChevronRight,
  Send,
  User,
  Bot,
  Mail,
  Calendar,
  FileText,
  Database,
  Info,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

type Version = 'V1' | 'V2';
type EmployeeStatus = 'Active' | 'Processing' | 'Archived' | 'Draft';
type Tier = 'Individual' | 'Lead' | 'Executive';
type Tab = 'search' | 'offboarding' | 'avatar_admin';
type ChatType = 'group' | 'twin';

interface DigitalEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: EmployeeStatus;
  tier: Tier;
  createdAt: string;
  lastActive: string;
  archiveDate: string;
  dataSources: string[];
  questionsRemaining: number;
  isArchived?: boolean;
  activationFee?: number;
  monthlyFee?: number;
  accessExpiresIn?: number;
  archiveFeeDue?: number;
}

interface HandoverGroup {
  id: string;
  employeeId: string;
  name: string;
  progress: number;
  status: 'Awaiting' | 'Building' | 'Live' | 'Overdue';
  lastMessage: string;
  timestamp: string;
}

interface Message {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: string;
  isLocked?: boolean;
  isCard?: boolean;
  cardData?: any;
  citations?: Citation[];
}

interface Citation {
  source: string;
  title: string;
  time: string;
  link: string;
}

// --- Mock Data ---

const MOCK_EMPLOYEES: DigitalEmployee[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'Senior Product Designer',
    status: 'Active',
    tier: 'Lead',
    createdAt: '2025-12-15',
    lastActive: '2026-03-20',
    archiveDate: '2026-03-15',
    dataSources: ['Slack', 'Gmail', 'Figma', 'Confluence'],
    questionsRemaining: 3,
    activationFee: 349,
    monthlyFee: 9,
  },
  {
    id: '2',
    name: 'David Miller',
    email: 'david.miller@company.com',
    role: 'Engineering Lead',
    status: 'Active',
    tier: 'Executive',
    createdAt: '2025-11-01',
    lastActive: '2026-02-15',
    archiveDate: '2026-02-01',
    dataSources: ['Slack', 'GitHub', 'Jira', 'Notion'],
    questionsRemaining: 0,
    isArchived: true,
    activationFee: 599,
    monthlyFee: 9,
  },
  {
    id: '3',
    name: 'Alex Rivera',
    email: 'alex.rivera@company.com',
    role: 'Marketing Manager',
    status: 'Active',
    tier: 'Individual',
    createdAt: '2026-03-22',
    lastActive: '2026-03-22',
    archiveDate: '2026-06-22',
    dataSources: ['Slack', 'Gmail'],
    questionsRemaining: 3,
    activationFee: 199,
    monthlyFee: 9,
  },
  {
    id: '4',
    name: 'Jessica Wu',
    email: 'jessica.wu@company.com',
    role: 'Data Scientist',
    status: 'Active',
    tier: 'Lead',
    createdAt: '2025-10-10',
    lastActive: '2026-03-18',
    archiveDate: '2026-01-10',
    dataSources: ['Slack', 'GitHub', 'Python'],
    questionsRemaining: 5,
    activationFee: 349,
    monthlyFee: 9,
    accessExpiresIn: 12, // Days left of high-frequency access
  },
  {
    id: '5',
    name: 'Kevin Hart',
    email: 'kevin.hart@company.com',
    role: 'Sales Director',
    status: 'Active',
    tier: 'Executive',
    createdAt: '2025-08-05',
    lastActive: '2026-03-21',
    archiveDate: '2025-11-05',
    dataSources: ['Salesforce', 'Gmail', 'Slack'],
    questionsRemaining: 2,
    activationFee: 599,
    monthlyFee: 9,
    archiveFeeDue: 3, // Days until next $9 payment
  },
  {
    id: '6',
    name: 'Marcus Chen (Expired Test)',
    email: 'marcus.chen@company.com',
    role: 'Senior Architect',
    status: 'Archived',
    tier: 'Executive',
    createdAt: '2024-01-01',
    lastActive: '2025-12-31',
    archiveDate: '2025-12-01',
    dataSources: ['Slack', 'GitHub', 'Confluence'],
    questionsRemaining: 0,
    isArchived: true,
    activationFee: 499,
    monthlyFee: 9,
    archiveFeeDue: 0,
  }
];

// --- Components ---

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'info' | 'error' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    info: 'bg-blue-50 text-blue-700 border border-blue-100',
    error: 'bg-rose-50 text-rose-700 border border-rose-100',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", variants[variant])}>
      {children}
    </span>
  );
};

const MOCK_GROUPS: HandoverGroup[] = [
  {
    id: 'g1',
    employeeId: '1',
    name: 'Sarah Chen Handover',
    progress: 65,
    status: 'Building',
    lastMessage: 'Relay Orchestrator: Please update progress.',
    timestamp: '2m ago'
  },
  {
    id: 'g2',
    employeeId: '2',
    name: 'David Miller Handover',
    progress: 100,
    status: 'Live',
    lastMessage: 'Handover completed successfully.',
    timestamp: '1h ago'
  },
  {
    id: 'g3',
    employeeId: '3',
    name: 'Alex Rivera Offboarding',
    progress: 20,
    status: 'Awaiting',
    lastMessage: 'Waiting for leaver to link data sources.',
    timestamp: '3h ago'
  },
  {
    id: 'g4',
    employeeId: '4',
    name: 'Jessica Wu Handover',
    progress: 85,
    status: 'Building',
    lastMessage: 'Knowledge extraction at 85%.',
    timestamp: '5h ago'
  }
];

export default function App() {
  const [version, setVersion] = useState<Version>('V1');
  const [activeTab, setActiveTab] = useState<Tab>('avatar_admin');
  const [selectedChat, setSelectedChat] = useState<{ type: ChatType, id: string } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<DigitalEmployee | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [offboardingStep, setOffboardingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [employees, setEmployees] = useState<DigitalEmployee[]>(MOCK_EMPLOYEES);
  const [groups, setGroups] = useState<HandoverGroup[]>(MOCK_GROUPS);
  const [newOffboardingName, setNewOffboardingName] = useState('');
  const [newOffboardingEmail, setNewOffboardingEmail] = useState('');
  const [lastCreatedGroupId, setLastCreatedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'bot', 
      content: "I'm Shawn AI. I have access to Sarah's project history and decisions. How can I help you today?", 
      timestamp: '10:00 AM',
      citations: [
        { source: 'Slack', title: 'Project X Design Sync', time: '2025-12-10', link: '#' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('semantic');

  useEffect(() => {
    if (offboardingStep === 4) {
      const timer = setTimeout(() => {
        setOffboardingStep(5);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [offboardingStep]);

  useEffect(() => {
    if (selectedChat) {
      const isTwin = selectedChat.type === 'twin';
      const employee = isTwin ? employees.find(e => e.id === selectedChat.id) : null;
      const group = !isTwin ? groups.find(g => g.id === selectedChat.id) : null;
      
      const introContent = isTwin 
        ? `I'm ${employee?.name.split(' ')[0]} AI. I have access to ${employee?.name.split(' ')[0]}'s project history and decisions. How can I help you today?`
        : `This is the handover group for ${group?.name.replace(' Handover', '')}. I'm the Relay Orchestrator, here to help manage the transition.`;

      setMessages([
        { 
          id: '1', 
          role: 'bot', 
          content: introContent, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: isTwin ? [
            { source: 'Slack', title: `${employee?.name.split(' ')[0]}'s Design Sync`, time: '2025-12-10', link: '#' }
          ] : []
        }
      ]);
    }
  }, [selectedChat, employees, groups]);

  // --- Handlers ---

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const isTwin = selectedChat?.type === 'twin';
    const employee = isTwin ? employees.find(e => e.id === selectedChat.id) : null;
    const isLimitReached = version === 'V2' && ((employee?.isArchived && questionsUsed >= 3) || (employee?.questionsRemaining === 0));
    const isBetaHint = version === 'V1' && ((employee?.isArchived && questionsUsed >= 3) || (employee?.questionsRemaining === 0));

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    if (isTwin) {
      setQuestionsUsed(prev => prev + 1);
    }

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: isLimitReached 
          ? `You've reached the daily free limit for this archived asset. Unlock full access to continue exploring ${employee?.name}'s knowledge.`
          : isBetaHint
          ? `[BETA PREVIEW] Based on ${employee?.name || 'the group'}'s project archives, the decision to use a modular grid system for the dashboard was made in late 2025. In the upcoming paid version, access to archived assets will require a subscription.`
          : `Based on ${employee?.name || 'the group'}'s project archives, the decision to use a modular grid system for the dashboard was made in late 2025 to ensure scalability across different device sizes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLocked: isLimitReached
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const startOffboarding = () => {
    setActiveTab('offboarding');
    setOffboardingStep(1);
  };

  const nextStep = () => {
    if (offboardingStep === 2) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setOffboardingStep(3);
      }, 2000);
    } else {
      setOffboardingStep(prev => prev + 1);
    }
  };

  // --- Views ---

  const renderDigitalEmployeeList = () => (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avatar Admin</h1>
          <p className="text-sm text-gray-500">Manage and monitor your organization's digital employee assets.</p>
        </div>
      </div>

      {/* Commercialization Dashboard Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <Badge variant="info">Active Assets</Badge>
          </div>
          <div>
            <p className="text-2xl font-black">{employees.filter(e => e.status === 'Active').length}</p>
            <p className="text-xs text-gray-500">Digital Employees Deployed</p>
          </div>
        </div>

        <div className="bg-black text-white rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
              <Zap size={20} fill="white" />
            </div>
            <Badge variant="warning">Beta Savings</Badge>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-black text-white">$4,188.00</p>
            <p className="text-xs text-white/60">Total Value Preserved (Beta)</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <Badge variant="warning">Future Cost</Badge>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-400">$349.00 / avg</p>
            <p className="text-xs text-gray-500">Estimated V2 Activation Fee</p>
          </div>
        </div>
      </div>

      {/* Commercialization Alerts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Bell size={14} /> Critical Alerts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900">Archive Fee Due Soon</p>
                <p className="text-[10px] text-rose-700">Kevin Hart's asset expires in 3 days. $9.00 will be billed.</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-rose-600 hover:underline">Manage Billing</button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <Zap size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">High-Frequency Access Ending</p>
                <p className="text-[10px] text-amber-700">Jessica Wu's unlimited period ends in 12 days.</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-amber-600 hover:underline">Extend Access</button>
          </motion.div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <motion.div 
            key={emp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
            onClick={() => {
              setSelectedChat({ type: 'twin', id: emp.id });
              setActiveTab('search');
            }}
          >
            {version === 'V1' && (
              <div className="absolute -right-8 -top-8 w-16 h-16 bg-amber-500/10 rotate-45 flex items-end justify-center pb-1">
                <Zap size={12} className="text-amber-600 -rotate-45" />
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                {emp.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={
                  emp.isArchived ? 'info' :
                  emp.status === 'Active' ? 'success' : 
                  emp.status === 'Processing' ? 'warning' : 'default'
                }>
                  {emp.isArchived ? 'Archived' : emp.status}
                </Badge>
                <span className="text-[10px] text-gray-400 font-medium uppercase">{emp.tier}</span>
              </div>
            </div>
            
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{emp.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{emp.role}</p>
            
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Knowledge Base</span>
                <span className="text-gray-600 font-medium">1.2 GB / 4.5k Docs</span>
              </div>
              {version === 'V1' && (
                <div className="flex items-center justify-between text-[11px] p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 italic">Est. Asset Value</span>
                  <span className="text-amber-600 font-bold">${emp.activationFee}.00</span>
                </div>
              )}
              {emp.isArchived && (
                <div className="flex items-center justify-between text-[11px] p-2 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 font-bold">Archive Fee</span>
                  <span className="text-blue-600 font-bold">${emp.monthlyFee}/mo</span>
                </div>
              )}
              {emp.accessExpiresIn && (
                <div className="flex items-center justify-between text-[11px] p-2 bg-amber-50 rounded-lg">
                  <span className="text-amber-600 font-bold">Unlimited Access</span>
                  <span className="text-amber-600 font-bold">{emp.accessExpiresIn} days left</span>
                </div>
              )}
              {emp.archiveFeeDue && (
                <div className="flex items-center justify-between text-[11px] p-2 bg-rose-50 rounded-lg">
                  <span className="text-rose-600 font-bold">Next Billing</span>
                  <span className="text-rose-600 font-bold">in {emp.archiveFeeDue} days</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Last Active</span>
                <span className="text-gray-600 font-medium">{emp.lastActive}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderOffboardingWizard = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      {offboardingStep > 0 && (
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                offboardingStep >= step ? "bg-black text-white" : "bg-gray-100 text-gray-400"
              )}>
                {step}
              </div>
              {step < 5 && (
                <div className={cn(
                  "h-1 w-8 rounded-full",
                  offboardingStep > step ? "bg-black" : "bg-gray-100"
                )} />
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {offboardingStep === 0 && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Offboarding Processes</h2>
                <p className="text-sm text-gray-500">Track and manage ongoing employee offboarding.</p>
              </div>
              <button 
                onClick={() => setOffboardingStep(1)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                New Offboarding
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {groups.map((group) => (
                <div 
                  key={group.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                      {group.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{group.name}</h3>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{group.status} • {group.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold">{group.progress}%</p>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full" 
                          style={{ width: `${group.progress}%` }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedChat({ type: 'group', id: group.id });
                        setActiveTab('search');
                      }}
                      className="p-2 text-gray-400 hover:text-black transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {offboardingStep === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 1: Draft Offboarding</h2>
              <p className="text-sm text-gray-500">Initiate the digital asset preservation process for a leaver.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Employee Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sarah Chen"
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                  value={newOffboardingName}
                  onChange={(e) => setNewOffboardingName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Employee Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="e.g. sarah.chen@company.com"
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                    value={newOffboardingEmail}
                    onChange={(e) => setNewOffboardingEmail(e.target.value)}
                  />
                  {/* Mock existing process warning */}
                  <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 hidden group-focus-within:flex">
                    <AlertCircle size={16} className="text-rose-600" />
                    <p className="text-[10px] text-rose-700">Note: This employee may already have an active process.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Last Working Day</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase">Handover Receivers (Viewers)</label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    { name: 'David Miller', role: 'Product Lead', selected: true },
                    { name: 'Alex Rivera', role: 'Engineering Manager', selected: true },
                    { name: 'Sarah Jenkins', role: 'HR Business Partner', selected: false },
                    { name: 'Michael Scott', role: 'Regional Manager', selected: false },
                    { name: 'Pam Beesly', role: 'Office Administrator', selected: false },
                    { name: 'Jim Halpert', role: 'Sales Lead', selected: false },
                    { name: 'Dwight Schrute', role: 'Assistant to the RM', selected: false },
                    { name: 'Angela Martin', role: 'Head of Accounting', selected: false },
                  ].map((person, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                      person.selected ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:border-gray-300"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                          person.selected ? "bg-white/20" : "bg-gray-100 text-gray-600"
                        )}>
                          {person.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{person.name}</p>
                          <p className={cn("text-[10px]", person.selected ? "text-white/60" : "text-gray-400")}>{person.role}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center",
                        person.selected ? "bg-white border-white text-black" : "border-gray-300"
                      )}>
                        {person.selected && <CheckCircle2 size={12} />}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-all flex items-center justify-center gap-2">
                  <Plus size={14} /> Add Custom Receiver
                </button>
              </div>
            </div>
            <button 
              onClick={() => setOffboardingStep(2)}
              className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
            >
              Generate Offboarding Invitation
            </button>
          </motion.div>
        )}

        {offboardingStep === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 2: Pending Join & Link</h2>
              <p className="text-sm text-gray-500">Waiting for the leaver to accept the invitation and link data sources.</p>
            </div>
            
            <div className="p-6 bg-white border border-gray-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Invitation Sent</p>
                    <p className="text-[10px] text-gray-400 uppercase">Waiting for response...</p>
                  </div>
                </div>
                <Badge variant="warning">PENDING</Badge>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase">Required Data Sources</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Email', 'Slack', 'Drive', 'Jira'].map(source => (
                    <div key={source} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-xs font-medium">{source}</span>
                      <div className="w-2 h-2 bg-gray-200 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
              <Info className="text-blue-600 shrink-0" size={18} />
              <p className="text-[10px] text-blue-700 leading-relaxed">
                Relay Orchestrator will automatically create the <strong>Handover Group</strong> once the leaver links at least one data source.
              </p>
            </div>

            <button 
              onClick={() => {
                setIsProcessing(true);
                setTimeout(() => {
                  setIsProcessing(false);
                  setOffboardingStep(3);
                }, 2000);
              }}
              className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : "Simulate Leaver Link"}
            </button>
          </motion.div>
        )}

        {offboardingStep === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 3: Create Digital Employee</h2>
              <p className="text-sm text-gray-500">Data preparation complete. Confirm creation of the knowledge asset.</p>
            </div>

            <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-8 bg-black text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Bot size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Digital Employee Asset</h3>
                      <p className="text-xs text-white/60">Lead Tier • Sarah Chen Knowledge Base</p>
                    </div>
                  </div>
                  {version === 'V1' ? (
                    <Badge variant="warning">BETA FREE</Badge>
                  ) : (
                    <Badge variant="success">PAID ACCESS</Badge>
                  )}
                </div>
                
                <div className="space-y-6 mb-8">
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">What is it?</p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      A Digital Employee is a persistent AI asset that preserves the work memory and decision logic of your team members.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">What can it do?</p>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { icon: <Search size={14} />, text: 'Query institutional knowledge instantly' },
                        { icon: <Zap size={14} />, text: 'Understand deep decision logic from archives' },
                        { icon: <RefreshCw size={14} />, text: 'Maintain project continuity after handover' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs text-gray-200">
                          <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center">
                            {item.icon}
                          </div>
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                      {version === 'V1' ? 'Future Price' : 'Current Price'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black">$349</span>
                      <span className="text-sm text-white/40 line-through">$698</span>
                      <span className="text-xs text-white/60">/ one-time</span>
                    </div>
                  </div>
                  {version === 'V1' && (
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Current Status</p>
                      <p className="text-lg font-bold text-emerald-400">FREE (BETA)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-4 bg-gray-50">
                <button 
                  onClick={() => {
                    setIsProcessing(true);
                    setTimeout(() => {
                      setIsProcessing(false);
                      
                      // Add new employee and group
                      const newId = Date.now().toString();
                      const newEmp: DigitalEmployee = {
                        id: newId,
                        name: newOffboardingName || 'New Employee',
                        email: newOffboardingEmail || 'new@company.com',
                        role: 'Team Member',
                        status: 'Active', // 标记为“已激活”
                        tier: 'Lead',
                        createdAt: new Date().toISOString().split('T')[0],
                        lastActive: new Date().toISOString().split('T')[0],
                        archiveDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        dataSources: ['Slack', 'Gmail'],
                        questionsRemaining: 5,
                        activationFee: 349,
                        monthlyFee: 9,
                        accessExpiresIn: 90
                      };
                      
                      const newGroup: HandoverGroup = {
                        id: `g-${newId}`,
                        employeeId: newId,
                        name: `${newOffboardingName || 'New Employee'} Handover`,
                        progress: 0,
                        status: 'Building',
                        lastMessage: 'Digital Employee created. Handover started.',
                        timestamp: 'Just now'
                      };
                      
                      setEmployees(prev => [newEmp, ...prev]);
                      setGroups(prev => [newGroup, ...prev]);
                      setLastCreatedGroupId(`g-${newId}`);
                      
                      setOffboardingStep(4);
                    }, 2000);
                  }}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center justify-center gap-2"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : "Continue & Activate Digital Employee"}
                </button>
                <button 
                  onClick={() => setOffboardingStep(1)}
                  className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Not Now (Keep as Draft)
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
              <Info className="text-blue-600 shrink-0" size={18} />
              <p className="text-[10px] text-blue-700 leading-relaxed">
                <strong>Monetization Note:</strong> This step establishes the value of the Digital Employee. Even if free during Beta, it creates the habit of asset ownership.
              </p>
            </div>
          </motion.div>
        )}

        {offboardingStep === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 text-center py-12"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
              <motion.div 
                className="absolute inset-0 border-4 border-black rounded-full border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Bot size={32} className="text-black" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Creating Digital Employee...</h2>
              <p className="text-sm text-gray-500">Structuring knowledge base and building work memory.</p>
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Ingesting Data</span>
                <span>85%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  className="h-full bg-black"
                />
              </div>
            </div>
            <button 
              onClick={() => setOffboardingStep(5)}
              className="px-8 py-3 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed"
              disabled
            >
              Please wait...
            </button>
          </motion.div>
        )}

        {offboardingStep === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold">Knowledge Asset Live</h2>
              <p className="text-sm text-gray-500">The Digital Employee is now active and ready for handover.</p>
            </div>

            <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">Relay Orchestrator Active</h3>
                  <p className="text-xs text-gray-500">Automated process monitoring enabled.</p>
                </div>
                <Badge variant="success">LIVE</Badge>
              </div>

              <div className="p-4 bg-white border border-gray-100 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                  <Zap size={14} className="text-amber-500" />
                  Orchestrator Actions
                </div>
                <ul className="space-y-2">
                  {[
                    'Auto-generated Handover Card',
                    'Knowledge Unit extraction started',
                    'Progress tracking enabled',
                    'Handover reminder scheduled'
                  ].map((action, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1 h-1 bg-black rounded-full" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    if (lastCreatedGroupId) {
                      setSelectedChat({ type: 'group', id: lastCreatedGroupId });
                    } else {
                      setSelectedChat({ type: 'group', id: 'g1' });
                    }
                    setActiveTab('search');
                  }}
                  className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
                >
                  Go to Handover Group
                </button>
                <button 
                  onClick={() => setOffboardingStep(0)}
                  className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Back to Offboarding List
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderOffboardingCard = (group: HandoverGroup) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Offboarding Card</h4>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Relay Orchestrator</p>
          </div>
        </div>
        <Badge variant={group.status === 'Live' ? 'success' : 'warning'}>{group.status}</Badge>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Handover Progress</span>
          <span className="font-bold">{group.progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${group.progress}%` }}
            className="h-full bg-blue-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Assets Detected</p>
          <p className="text-sm font-bold">4.5k Units</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Data Sources</p>
          <p className="text-sm font-bold">4 Linked</p>
        </div>
      </div>

      <button className="w-full py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors">
        View Handover Details
      </button>
    </div>
  );

  const renderChatInterface = () => {
    const isTwin = selectedChat?.type === 'twin';
    const isGroup = selectedChat?.type === 'group';
    const employee = isTwin ? employees.find(e => e.id === selectedChat.id) : null;
    const chatTitle = isTwin 
      ? `${employee?.name.split(' ')[0]} AI`
      : groups.find(g => g.id === selectedChat?.id)?.name || 'Handover Group';

    return (
      <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Chat Header */}
        {version === 'V2' && ((employee?.isArchived && questionsUsed >= 3) || (employee?.questionsRemaining === 0)) && (
          <div className="bg-rose-600 text-white px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Daily Free Limit Reached</span>
            </div>
            <button 
              onClick={() => setShowPricingModal(true)}
              className="text-[10px] font-bold underline hover:text-white/80"
            >
              Unlock Unlimited Access
            </button>
          </div>
        )}
        {version === 'V1' && ((employee?.isArchived && questionsUsed >= 3) || (employee?.questionsRemaining === 0)) && (
          <div className="bg-amber-500 text-white px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Beta Preview: Archived Asset</span>
            </div>
            <div className="text-[10px] font-medium">
              Unlimited access is free during Beta. <button onClick={() => setShowPricingModal(true)} className="underline font-bold">See future pricing</button>
            </div>
          </div>
        )}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
              {chatTitle[0]}
            </div>
            <div>
              <h3 className="font-bold text-sm">{chatTitle}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  {employee?.isArchived ? 'Archived Asset (Limited)' : 'Knowledge Asset Active'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {version === 'V1' && isTwin && (
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Beta Free</span>
                <span className="text-[10px] text-amber-600 italic">(${employee?.activationFee}/query value)</span>
              </div>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isGroup && (
            <div className="max-w-[80%] mx-auto">
              {renderOffboardingCard(groups.find(g => g.id === selectedChat?.id)!)}
            </div>
          )}
          
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[80%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-blue-100 text-blue-600" : 
                msg.role === 'system' ? "bg-amber-100 text-amber-600" : "bg-black text-white"
              )}>
                {msg.role === 'user' ? <User size={16} /> : msg.role === 'system' ? <Zap size={16} /> : <Bot size={16} />}
              </div>
              <div className="space-y-2">
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none",
                  msg.isLocked ? "bg-rose-50 border border-rose-100 text-rose-800" : ""
                )}>
                  {msg.content}
                  
                  {msg.role === 'bot' && !msg.isLocked && isTwin && (
                    <div className="mt-2 pt-2 border-t border-gray-200/30 text-[9px] text-gray-400 italic">
                      Powered by {employee?.name}'s digital employee work memory.
                    </div>
                  )}
                  
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">References</p>
                      {msg.citations.map((cite, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/50 rounded-lg border border-gray-200/50">
                          <div className="flex items-center gap-2">
                            <FileText size={12} className="text-gray-400" />
                            <span className="text-[10px] font-medium text-gray-600">{cite.title}</span>
                          </div>
                          <span className="text-[9px] text-gray-400">{cite.time}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.isLocked && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-rose-200 space-y-3">
                      <div className="flex items-center gap-2 text-rose-600 font-bold">
                        <Lock size={16} />
                        <span>Free Limit Reached</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Unlock full access to {chatTitle}'s knowledge for unlimited queries.
                      </p>
                      <button 
                        onClick={() => setShowPricingModal(true)}
                        className="w-full py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                      >
                        Unlock Full Access
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 font-medium px-1">{msg.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-100">
          <div className="relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isTwin ? `Ask ${chatTitle} about past projects...` : "Message group or orchestrator..."}
              className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm"
            />
            <button 
              onClick={handleSendMessage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-medium">
              {isTwin ? `${employee?.name.split(' ')[0]} AI: Individual Knowledge Asset` : `Relay Orchestrator: System Process Bot`}
            </p>
            {version === 'V1' && isTwin && (
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Beta: Unlimited Access</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGlobalSearchView = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-black tracking-tight">Search Knowledge</h1>
        <p className="text-gray-500">Query across all digital employee assets and handover groups.</p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl mb-4">
          <button 
            onClick={() => setSearchMode('semantic')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
              searchMode === 'semantic' ? "bg-white text-black shadow-sm" : "text-gray-400"
            )}
          >
            Semantic Search
          </button>
          <button 
            onClick={() => setSearchMode('keyword')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
              searchMode === 'keyword' ? "bg-white text-black shadow-sm" : "text-gray-400"
            )}
          >
            Keyword Search
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchMode === 'semantic' ? "Describe what you're looking for..." : "Enter keywords..."}
            className="w-full pl-12 pr-4 py-5 bg-white border border-gray-200 rounded-3xl shadow-xl focus:ring-2 focus:ring-black focus:outline-none transition-all text-lg"
          />
        </div>
      </div>

      {searchQuery && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Search Results</h3>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-black transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">Knowledge Unit</Badge>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Sarah Chen • 2025-12-10</span>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
                </div>
                <p className="text-sm text-gray-800 leading-relaxed mb-4">
                  "The decision to use a modular grid system for the dashboard was made to ensure scalability across different device sizes. Sarah documented the grid specs in Figma..."
                </p>
                <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase">
                  <span className="flex items-center gap-1"><FileText size={12} /> Figma Specs</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> Design Sync</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderArchiveView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Archive</h1>
          <p className="text-sm text-gray-500">Long-term storage for offboarded employee digital assets.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Archive Date</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_EMPLOYEES.filter(e => e.status === 'Archived' || e.status === 'Active').map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{emp.name}</p>
                      <p className="text-[10px] text-gray-400">{emp.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={emp.status === 'Archived' ? 'info' : 'success'}>{emp.status}</Badge>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{emp.archiveDate}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: emp.status === 'Archived' ? '20%' : '100%' }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      {emp.status === 'Archived' ? '3/day' : 'Unlimited'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setActiveTab('chat');
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View Knowledge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Archive size={24} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">Archive Fee Policy</h3>
            <p className="text-xs text-blue-700">Assets are automatically archived after 3 months. Keep them active for $9/month.</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
          Manage Subscriptions
        </button>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Configure your workspace and billing preferences.</p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Billing & Commercialization</h3>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Demo Mode (V1 vs V2)</p>
                <p className="text-xs text-gray-500">Switch between Beta and Paid versions to test the flow.</p>
              </div>
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                <button 
                  onClick={() => setVersion('V1')}
                  className={cn(
                    "px-4 py-2 rounded-md text-xs font-bold transition-all",
                    version === 'V1' ? "bg-white text-black shadow-sm" : "text-gray-400"
                  )}
                >
                  V1 Beta
                </button>
                <button 
                  onClick={() => setVersion('V2')}
                  className={cn(
                    "px-4 py-2 rounded-md text-xs font-bold transition-all",
                    version === 'V2' ? "bg-white text-black shadow-sm" : "text-gray-400"
                  )}
                >
                  V2 Paid
                </button>
              </div>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Simulate Expired User</p>
                <p className="text-xs text-gray-500">
                  {version === 'V1' 
                    ? "Test the Beta Preview flow (free access with hints)." 
                    : "Test the Paid flow (strictly enforced locking)."}
                </p>
              </div>
              <button 
                onClick={() => {
                  const marcus = employees.find(e => e.id === '6');
                  if (marcus) {
                    setSelectedChat({ type: 'twin', id: '6' });
                    setActiveTab('search'); // Go to search first to see him in the list or just go to chat
                    // Actually, let's just go to chat
                    setActiveTab('chat');
                  }
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
              >
                Launch Test Chat
              </button>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Early Adopter Discount</p>
                <p className="text-xs text-gray-500">Status of the 50% lifetime discount for this workspace.</p>
              </div>
              <Badge variant="success">LOCKED IN</Badge>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Workspace</h3>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Workspace Name</p>
                <p className="text-xs text-gray-500">The name of your organization in Relay.</p>
              </div>
              <input 
                type="text" 
                defaultValue="Acme Corp" 
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  // --- Main Render ---

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={20} fill="white" />
            </div>
            <span className="text-xl font-black tracking-tighter">RELAY</span>
          </div>

          {/* Top Tabs - Vertical */}
          <div className="flex flex-col gap-2 mb-8">
            {[
              { id: 'search', label: '搜索', icon: <Search size={18} /> },
              { id: 'offboarding', label: 'Offboarding', icon: <Plus size={18} /> },
              { id: 'avatar_admin', label: 'Avatar Admin', icon: <Users size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedChat(null);
                  if (tab.id === 'offboarding') {
                    setOffboardingStep(0);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full",
                  activeTab === tab.id && !selectedChat 
                    ? "bg-black text-white shadow-lg shadow-black/10" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {tab.icon}
                <span className="text-sm font-bold">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Merged Chat List */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1">
            {/* Handover Groups & Digital Twins Unified List */}
            {[
              ...groups.map(g => ({ ...g, type: 'group' as ChatType })),
              ...employees.filter(e => e.status === 'Active').map(e => ({ ...e, type: 'twin' as ChatType }))
            ].sort((a, b) => (a.id > b.id ? 1 : -1)).map((item) => {
              const isSelected = selectedChat?.id === item.id;
              const isTwin = item.type === 'twin';
              const name = isTwin ? (item as DigitalEmployee).name : (item as HandoverGroup).name;
              const lastMsg = isTwin ? 'Knowledge Asset Live' : (item as HandoverGroup).lastMessage;
              const time = isTwin ? '' : (item as HandoverGroup).timestamp;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedChat({ type: item.type, id: item.id });
                    setActiveTab('search');
                  }}
                  className={cn(
                    "w-full text-left p-2 rounded-xl transition-all flex items-center gap-3 group",
                    isSelected ? "bg-black text-white shadow-lg" : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isSelected ? "bg-white/20" : "bg-gray-100 text-gray-600"
                  )}>
                    {name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-bold truncate">
                        {isTwin ? `${name.split(' ')[0]} AI` : name}
                      </span>
                      {time && (
                        <span className={cn("text-[9px] shrink-0", isSelected ? "text-white/40" : "text-gray-400")}>
                          {time}
                        </span>
                      )}
                      {isTwin && !isSelected && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                    </div>
                    <p className={cn("text-[10px] truncate", isSelected ? "text-white/60" : "text-gray-500")}>
                      {lastMsg}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-black" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                Managing {employees.length} digital employee assets.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
              {activeTab === 'avatar_admin' ? 'Avatar Admin' : 
               activeTab === 'offboarding' ? 'Offboarding' : 
               selectedChat ? (selectedChat.type === 'twin' ? 'Digital Twin' : 'Handover Group') : 'Search'}
            </h2>
          </div>

          {/* Demo Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
              <button 
                onClick={() => setVersion('V1')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                  version === 'V1' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                V1 (Beta)
              </button>
              <button 
                onClick={() => setVersion('V2')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                  version === 'V2' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                V2 (Paid)
              </button>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold">Admin User</p>
                <p className="text-[10px] text-gray-400 font-medium">lost7wbx@gmail.com</p>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {selectedChat ? (
              <motion.div 
                key={`chat-${selectedChat.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                {renderChatInterface()}
              </motion.div>
            ) : (
              <>
                {activeTab === 'avatar_admin' && (
                  <motion.div 
                    key="avatar_admin"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {renderDigitalEmployeeList()}
                  </motion.div>
                )}
                {activeTab === 'offboarding' && (
                  <motion.div 
                    key="offboarding"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {renderOffboardingWizard()}
                  </motion.div>
                )}
                {activeTab === 'search' && (
                  <motion.div 
                    key="search"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    {renderGlobalSearchView()}
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Pricing Modal Overlay */}
      <AnimatePresence>
        {showPricingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPricingModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Side: Value Prop */}
              <div className="md:w-1/2 bg-black p-12 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Zap className="text-white" size={24} fill="white" />
                    </div>
                    {version === 'V1' && (
                      <Badge variant="warning">Beta Preview</Badge>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold mb-4 leading-tight">
                    {version === 'V1' ? 'Beta Preview: Knowledge Access' : 'Unlock Full Knowledge Access'}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    {version === 'V1' 
                      ? "Get a preview of our upcoming premium knowledge access features. Preserve institutional knowledge and maintain project continuity."
                      : "Get unlimited access to Sarah Chen's digital employee. Preserve institutional knowledge and maintain project continuity."
                    }
                  </p>
                  
                  <ul className="space-y-4">
                    {[
                      'Unlimited AI-powered queries',
                      'Full access to 2,400+ messages',
                      'Deep decision logic extraction',
                      'Project context & history continuity',
                      'Long-term knowledge archiving'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-8 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Enterprise Grade Security</p>
                      <p className="text-[10px] text-gray-500">SOC2 Type II Compliant</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Pricing Tiers */}
              <div className="md:w-1/2 p-12 bg-gray-50 overflow-y-auto max-h-[80vh]">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold">Choose a Plan</h3>
                    {version === 'V1' && (
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Free during Beta</span>
                    )}
                  </div>
                  <button onClick={() => setShowPricingModal(false)} className="text-gray-400 hover:text-gray-600">
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { tier: 'Individual', price: '$199', desc: 'IC & Execution level', features: 'Chat + Email - 3mo Unlimited', archive: '$9/mo' },
                    { tier: 'Lead', price: '$349', desc: 'PM & Team Lead level', features: 'Project Docs & Wiki - 3mo Unlimited', archive: '$9/mo', recommended: true },
                    { tier: 'Executive', price: '$599', desc: 'Director & Above', features: 'Full Knowledge Graph - 3mo Unlimited', archive: '$9/mo' },
                  ].map((plan) => (
                    <div 
                      key={plan.tier}
                      className={cn(
                        "p-5 rounded-2xl border-2 transition-all cursor-pointer group",
                        plan.recommended ? "border-black bg-white shadow-lg" : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900">{plan.tier}</h4>
                            {plan.recommended && <Badge variant="info">Recommended</Badge>}
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium">{plan.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black">{plan.price}</p>
                          <p className="text-[8px] text-gray-400 font-bold uppercase">One-time</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] text-gray-600">{plan.features}</p>
                        <p className="text-[9px] text-gray-400 font-bold italic">Archive: {plan.archive}</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (version === 'V1') {
                            // In V1, just show a hint and close
                            alert("Beta Access Granted: This feature is free during our beta period. Full monetization will launch in V2.");
                            setShowPricingModal(false);
                          } else {
                            // In V2, proceed to payment (mock)
                            setShowPricingModal(false);
                          }
                        }}
                        className={cn(
                          "w-full py-2 rounded-lg text-xs font-bold transition-all",
                          plan.recommended ? "bg-black text-white" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                        )}
                      >
                        {version === 'V1' ? `Preview ${plan.tier}` : `Select ${plan.tier}`}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Beta User Reward</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700">-50% LIFETIME</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    As one of our first 1,000 users, you've locked in a 50% lifetime discount on all digital employee activations and archive fees.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
