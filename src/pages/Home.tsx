import { Bell, Search, Stethoscope, Pill, FolderOpen, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

const quickActions = [
  { icon: Stethoscope, label: "Check Symptoms", path: "/symptom-checker", color: "text-sky-500" },
  { icon: Upload, label: "Upload Report", path: "/report-analyzer", color: "text-green-500" },
  { icon: Pill, label: "Medicines", path: "/medicines", color: "text-purple-500" },
  { icon: FolderOpen, label: "My Records", path: "/health-records", color: "text-orange-500" },
];



const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground px-6 pt-8 pb-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold">AI-MED</p>
            <p className="text-xs opacity-90">Accessible Intelligent Medicine</p>
          </div>
          <button className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center hover:bg-primary-foreground/30 transition-smooth">
            <Bell className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-primary-foreground/20 rounded-2xl p-4 mb-4">
          <p className="text-sm opacity-90 mb-1">Hello,</p>
          <h1 className="text-xl font-bold mb-2">Welcome Back 👋</h1>
          <p className="text-xs opacity-80">Stay healthy, stay connected</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search doctors, medicines..."
            className="h-12 pl-12 rounded-2xl bg-card text-foreground border-0"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-bold mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {quickActions.map((action, idx) => (
            <Card
              key={idx}
              className="p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-card-hover transition-smooth"
              onClick={() => navigate(action.path)}
            >
              <div className={`w-12 h-12 bg-secondary rounded-full flex items-center justify-center`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <span className="text-xs text-center font-medium leading-tight">{action.label}</span>
            </Card>
          ))}
        </div>

        {/* Health Tip */}
        <Card className="p-4 mb-6 bg-green-light border-l-4 border-l-accent">
          <p className="text-sm font-semibold text-accent mb-1">💡 Health Tip of the Day</p>
          <p className="text-sm text-muted-foreground">
            Drink at least 8 glasses of water daily to stay hydrated and healthy!
          </p>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
