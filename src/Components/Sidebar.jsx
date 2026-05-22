import { NavLink } from "react-router-dom";
import {
  Squares2X2Icon,
  UserIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  TicketIcon,
  BanknotesIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useMemo } from "react";

// Sidebar width
const WIDTH = "w-72";

function Item({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center font-bold gap-3 px-3 py-2 text-md transition-colors border-l-2 ${
          isActive
            ? "text-[#ff237c] border-[#ff237c] border-r-4"
            : "text-gray-700 hover:bg-gray-100 border-transparent"
        }`
      }
    >
      {Icon && <Icon className="h-5 w-5 text-black" />}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  // ALL menu in one single clean list (NO sections)
  const menuList = useMemo(
    () => [
      { label: "Dashboard", to: "/dashboard/home", icon: Squares2X2Icon },

      { label: "Influencers", to: "/dashboard/influencers", icon: UserIcon },

      { label: "influncers Withdrawals", to: "/dashboard/withdrawals", icon: BanknotesIcon },
      { label: "Users", to: "/dashboard/users", icon: BanknotesIcon },
      { label: "Admin Data", to: "/dashboard/admin-data", icon: ClipboardDocumentListIcon },
      { label: "Sponsored Content", to: "/dashboard/sponsored-content", icon: TicketIcon },
      { label: "Banners", to: "/dashboard/banners", icon: TicketIcon },
      { label: "Categories", to: "/dashboard/categories", icon: MapPinIcon },
      { label: "FAQs", to: "/dashboard/faqs", icon: ClipboardDocumentListIcon },
      { label: "Reviews", to: "/dashboard/reviews", icon: ClipboardDocumentListIcon },
      { label: "Services", to: "/dashboard/services", icon: ClipboardDocumentListIcon },
      { label: "Expertise", to: "/dashboard/expertise", icon: ClipboardDocumentListIcon },
      { label: "User Queries", to: "/dashboard/user-queries", icon: ClipboardDocumentListIcon },
      { label: "My Profile", to: "/dashboard/my-profile", icon: UserIcon },
    ],
    []
  );

  const Content = (
    <div
      className={`h-full ${WIDTH} bg-white border-r border-gray-200 flex flex-col`}
    >
      {/* Mobile close button */}
      <div className="lg:hidden flex justify-end p-3">
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto pb-6 pt-5">
        <div className="space-y-1">
          {menuList.map((item) => (
            <Item
              key={item.label}
              to={item.to}
              icon={item.icon}
            
              label={item.label}
              onClick={onClose}
            />
          ))}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className={`hidden lg:block ${WIDTH} shrink-0`}>{Content}</div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-40 ${
          isOpen ? "" : "pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        {/* Sidebar sliding panel */}
        <div
          className={`absolute inset-y-0 left-0 transform transition-transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {Content}
        </div>
      </div>
    </>
  );
}
