import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { CheckCircle2, ShoppingBag, ArrowRight, UserPlus } from "lucide-react";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSignUp } = useClerk();
  const { isSignedIn } = useUser();

  const orderId = location.state?.orderId;

  const handleCreateAccount = () => {
    if (isSignedIn) {
      navigate("/my-orders");
      return;
    }

    openSignUp({
      afterSignUpUrl: "/my-orders",
      afterSignInUrl: "/my-orders",
    });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-[0_18px_50px_rgba(16,185,129,0.12)] md:p-10">
        <div className="flex items-center gap-3 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
          <h1 className="text-3xl font-black text-slate-900">
            Commande confirmée
          </h1>
        </div>

        <p className="mt-4 text-slate-600 text-lg leading-7">
          Votre commande a bien été enregistrée. Vous pouvez désormais continuer
          vos achats ou créer un compte en un clic pour suivre votre colis.
        </p>

        {orderId && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Référence :</span>{" "}
            {orderId}
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Astuce fidélisation
          </p>
          <p className="mt-2 text-base font-medium">
            Voulez-vous enregistrer ces informations et créer un compte en un
            clic pour suivre votre colis ?
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <button
            onClick={handleCreateAccount}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" />
            {isSignedIn ? "Voir mes commandes" : "Créer mon compte"}
          </button>

          <button
            onClick={() => navigate("/products")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ShoppingBag className="h-4 w-4" />
            Continuer les achats
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <ArrowRight className="h-4 w-4" />
          Le plus dur est déjà accompli : votre commande est en cours de
          traitement.
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
