import { HelpCircle, LogOut, ChevronRight, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUser());

  useEffect(() => {
    // Update user data when component mounts
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    authService.logout();
    toast.success("Logged out successfully");
    navigate("/signin");
  };

  const handleMenuClick = (item: any) => {
    if (item.label === "Logout") {
      handleLogout();
    } else {
      navigate(item.path);
    }
  };

  const menuItems = [
    { icon: Activity, label: "Symptom Tracker", path: "/symptom-tracker" },
    { icon: HelpCircle, label: "Help", path: "/help" },
    { icon: LogOut, label: "Logout", path: "/", variant: "danger" as const },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground px-6 pt-8 pb-12 rounded-b-[2rem]">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        {/* User Card */}
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>

          {/* Health Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold text-foreground">
                  {user?.bloodGroup || '--'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Blood Group</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold text-foreground">
                  {user?.height || '--'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Height (cm)</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold text-foreground">
                  {user?.weight || '--'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Weight (kg)</p>
            </div>
          </div>

          <Button 
            onClick={() => navigate('/edit-profile')}
            className="w-full"
            variant="outline"
          >
            Edit Profile
          </Button>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-6 mt-6 space-y-3">
        {menuItems.map((item) => (
          <Card
            key={item.label}
            className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-smooth"
            onClick={() => handleMenuClick(item)}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              item.variant === "danger" ? "bg-destructive/10" : "bg-secondary"
            }`}>
              <item.icon className={`w-6 h-6 ${
                item.variant === "danger" ? "text-destructive" : "text-primary"
              }`} />
            </div>
            <span className={`flex-1 font-medium ${
              item.variant === "danger" ? "text-destructive" : ""
            }`}>
              {item.label}
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
