import { ArrowLeft, Search, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import medicinesData from "@/data/medicines.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Medicine {
  id: string;
  brand_name: string;
  generic_name: string;
  components: Array<{ name: string; class: string; role: string }>;
  purpose: string;
  how_it_works: string;
  common_uses: string[];
  common_side_effects: string[];
  avoid_if: string[];
  notes: string;
  sources: string[];
}

const Medicines = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const filteredMedicines = medicinesData.filter((medicine) => {
    const query = searchQuery.toLowerCase();
    return (
      medicine.brand_name.toLowerCase().includes(query) ||
      medicine.generic_name.toLowerCase().includes(query) ||
      medicine.purpose.toLowerCase().includes(query) ||
      medicine.common_uses.some(use => use.toLowerCase().includes(query)) ||
      medicine.components.some(comp => comp.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground px-6 pt-8 pb-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Medicine Reference</h1>
          <div className="w-12" />
        </div>

        {/* Disclaimer */}
        <div className="bg-primary-foreground/10 rounded-lg p-3 flex gap-2 items-start">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs">
            This is educational information only, not medical advice. Always consult a qualified healthcare professional.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 mt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by medicine name, symptom, or condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Try: "cough", "fever", "headache", "acidity", "allergy", etc.
        </p>
      </div>

      {/* Medicines List */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-bold mb-4">💊 Common Medicines</h2>
        <div className="space-y-3">
          {filteredMedicines.map((medicine) => (
            <Card
              key={medicine.id}
              className="p-4 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedMedicine(medicine)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{medicine.brand_name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{medicine.generic_name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{medicine.purpose}</p>
                </div>
                <div className="text-3xl ml-3">💊</div>
              </div>
            </Card>
          ))}
        </div>

        {filteredMedicines.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No medicines found</p>
          </div>
        )}
      </div>

      {/* Medicine Detail Dialog */}
      <Dialog open={!!selectedMedicine} onOpenChange={() => setSelectedMedicine(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMedicine && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedMedicine.brand_name}</DialogTitle>
                <p className="text-muted-foreground">{selectedMedicine.generic_name}</p>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Components */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-xl">🧪</span> Drug Composition
                  </h3>
                  <div className="space-y-2">
                    {selectedMedicine.components.map((component, idx) => (
                      <div key={idx} className="bg-secondary/50 rounded-lg p-3">
                        <p className="font-medium">{component.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Class: {component.class}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Role: {component.role}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-xl">🎯</span> Purpose
                  </h3>
                  <p className="text-sm">{selectedMedicine.purpose}</p>
                </div>

                {/* How it works */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-xl">⚙️</span> How It Works
                  </h3>
                  <p className="text-sm">{selectedMedicine.how_it_works}</p>
                </div>

                {/* Common Uses */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-xl">📋</span> Common Uses
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedMedicine.common_uses.map((use, idx) => (
                      <li key={idx} className="text-sm">{use}</li>
                    ))}
                  </ul>
                </div>

                {/* Side Effects */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-xl">⚠️</span> Common Side Effects
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedMedicine.common_side_effects.map((effect, idx) => (
                      <li key={idx} className="text-sm text-orange-600 dark:text-orange-400">{effect}</li>
                    ))}
                  </ul>
                </div>

                {/* Contraindications */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-xl">🚫</span> Avoid If
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedMedicine.avoid_if.map((condition, idx) => (
                      <li key={idx} className="text-sm text-red-600 dark:text-red-400">{condition}</li>
                    ))}
                  </ul>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {selectedMedicine.notes}
                    </p>
                  </div>
                </div>

                {/* Sources */}
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground">Sources</h3>
                  <ul className="space-y-1">
                    {selectedMedicine.sources.map((source, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">• {source}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Medicines;
