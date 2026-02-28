import { useState } from "react";
import { Copy, Shield, Lock, QrCode, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

export function OnlinePaymentForm() {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const pixCode = "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .substring(0, 5);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Código Pix copiado!",
      description: "Cole no app do seu banco para pagar.",
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-fade-in">
      <Tabs defaultValue="pix" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-secondary mb-4">
          <TabsTrigger value="pix" className="text-sm">
            <QrCode className="h-4 w-4 mr-2" />
            Pix (Instantâneo)
          </TabsTrigger>
          <TabsTrigger value="card" className="text-sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Cartão de Crédito
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pix" className="space-y-4">
          <div className="flex flex-col items-center">
            {/* QR Code Placeholder */}
            <div className="w-48 h-48 bg-card rounded-xl flex items-center justify-center mb-4 border border-border">
              <div className="w-40 h-40 bg-secondary rounded-lg flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mb-3">
              Escaneie o QR Code ou copie o código abaixo
            </p>
            <Button
              onClick={handleCopyPix}
              className="w-full btn-primary-glow"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Código Pix
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="card" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-foreground">
                Número do Cartão
              </Label>
              <Input
                id="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="bg-secondary border-border h-12 text-base"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-foreground">
                  Validade
                </Label>
                <Input
                  id="expiry"
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className="bg-secondary border-border h-12 text-base"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc" className="text-foreground">
                  CVC
                </Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").substring(0, 4))}
                  className="bg-secondary border-border h-12 text-base"
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Shield className="h-4 w-4 text-emerald-500" />
          <span className="text-xs">Pagamento Seguro</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Lock className="h-4 w-4 text-emerald-500" />
          <span className="text-xs">SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
}
