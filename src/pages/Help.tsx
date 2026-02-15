import { ArrowLeft, ChevronDown, Search, MessageCircle, Shield, FileText, Pill, Activity, Upload, UserCog, Mail, Phone, HelpCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  icon: any;
  category: string;
  color: string;
}

const categories = [
  { label: "All", value: "all" },
  { label: "Account", value: "account" },
  { label: "Reports", value: "reports" },
  { label: "Features", value: "features" },
  { label: "Security", value: "security" },
];

const faqs: FAQ[] = [
  {
    id: 1,
    question: "How do I update my health profile?",
    answer: "Go to your Profile page and click 'Edit Profile'. You can update your blood group, height (cm), weight (kg), gender, and other personal information. Click 'Save Changes' when you're done — your data will be available on your next visit.",
    icon: UserCog,
    category: "account",
    color: "text-sky-500 bg-sky-500/10",
  },
  {
    id: 2,
    question: "How do I upload and analyze a medical report?",
    answer: "From the Home page, tap 'Upload Report' or go to Report Analyzer. Take a photo of your medical report or upload an existing image. Our AI will extract text and provide a detailed analysis of findings, abnormalities, and recommendations.",
    icon: Upload,
    category: "reports",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    id: 3,
    question: "How do I search for medicines?",
    answer: "Tap 'Medicines' from the Home page or bottom navigation. Search by medicine name (e.g., 'Paracetamol'), symptom (e.g., 'cough'), or condition (e.g., 'headache'). Tap any medicine for detailed info including uses, side effects, and contraindications.",
    icon: Pill,
    category: "features",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    id: 4,
    question: "Where can I view my saved medical records?",
    answer: "Tap 'My Records' from the Home page or 'Records' in the bottom navigation. You'll find all uploaded medical reports with their AI analysis. You can download or share any report using the provided buttons.",
    icon: FileText,
    category: "reports",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    id: 5,
    question: "Is the medicine information reliable?",
    answer: "All medicine information is sourced from verified databases including CDSCO, WHO Essential Medicines List, FDA Drug Database, and other official references. However, this is for educational purposes only — always consult a qualified doctor for medical advice.",
    icon: Shield,
    category: "features",
    color: "text-rose-500 bg-rose-500/10",
  },
  {
    id: 6,
    question: "Can I use the symptom checker for diagnosis?",
    answer: "The symptom checker helps you understand potential health concerns. It is NOT a substitute for professional diagnosis. Always consult a healthcare provider for proper diagnosis and treatment. Think of it as a starting point, not a final answer.",
    icon: Activity,
    category: "features",
    color: "text-indigo-500 bg-indigo-500/10",
  },
  {
    id: 7,
    question: "How secure is my medical data?",
    answer: "Your data is stored securely with encryption and industry-standard security practices. Your personal health information is only accessible to you when logged in. We never share your data with third parties.",
    icon: Shield,
    category: "security",
    color: "text-teal-500 bg-teal-500/10",
  },
  {
    id: 8,
    question: "What should I do if I forgot my password?",
    answer: "On the Sign In page, click 'Forgot Password?'. Enter your registered email and we'll send you a password reset link. The link expires in 1 hour. Follow the instructions in the email to set a new password.",
    icon: HelpCircle,
    category: "account",
    color: "text-orange-500 bg-orange-500/10",
  },
  {
    id: 9,
    question: "What does the AI report analysis include?",
    answer: "The AI extracts text from your document and provides: key findings & abnormalities, interpretation of test results, potential health concerns, and general recommendations. This is for informational purposes and should not replace professional medical advice.",
    icon: Sparkles,
    category: "reports",
    color: "text-cyan-500 bg-cyan-500/10",
  },
  {
    id: 10,
    question: "Why do I need to verify my email?",
    answer: "Email verification ensures your account security and allows us to send important notifications like password resets. After signing up, check your inbox for a verification link. You must verify before you can log in.",
    icon: Mail,
    category: "account",
    color: "text-pink-500 bg-pink-500/10",
  },
];

const Help = () => {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    if (!matchesCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-accent/70 text-primary-foreground px-6 pt-8 pb-8 rounded-b-[2rem] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-4 left-0 w-20 h-20 bg-white/5 rounded-full -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-smooth"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Help & FAQs</h1>
            <div className="w-11" />
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-semibold mb-1">How can we help you?</h2>
            <p className="text-sm text-white/75">Search or browse frequently asked questions</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search your question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 rounded-2xl bg-card text-foreground border-0 shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-6 mt-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-smooth ${
                activeCategory === cat.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Count */}
      <div className="px-6 mb-3">
        <p className="text-sm text-muted-foreground">
          {filteredFaqs.length} {filteredFaqs.length === 1 ? "question" : "questions"} found
        </p>
      </div>

      {/* FAQs */}
      <div className="px-6 space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No results found</h3>
            <p className="text-sm text-muted-foreground">
              Try a different search term or category
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            const IconComponent = faq.icon;

            return (
              <Card
                key={faq.id}
                className={`overflow-hidden border transition-all duration-300 ${
                  isOpen
                    ? "shadow-md border-primary/30"
                    : "shadow-card hover:shadow-card-hover border-border"
                }`}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${faq.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="flex-1 font-medium text-sm leading-snug">
                    {faq.question}
                  </h3>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isOpen
                        ? "bg-primary text-primary-foreground rotate-180"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 pb-4 pt-0 ml-[52px]">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Contact Support */}
      <div className="px-6 mt-8 mb-6">
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">Still need help?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Can't find what you're looking for? Our support team is here for you.
                </p>
                <a
                  href="mailto:Saadsaleem17oct@gmail.com"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  Saadsaleem17oct@gmail.com
                </a>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Help;
