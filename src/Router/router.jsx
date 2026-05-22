import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../Pages/login.jsx";
import { PrivateRoute } from "../Central_Store/app_context.jsx";
import DashboardLayout from "../Components/DashboardLayout.jsx";
import Home from "../Pages/home.jsx";
import Influencers from "../Pages/influencers.jsx";
import Withdrawals from "../Pages/withdrawals.jsx";

import Banners from "../Pages/banner.jsx";
import Categories from "../Pages/category.jsx";
import Users from "../Pages/users.jsx";
import UserDetail from "../Pages/userDetail.jsx";
import AdminData from "../Pages/adminData.jsx";
import SponsoredContent from "../Pages/sponsoredContent.jsx";
import Reviews from "../Pages/review.jsx";
import FaqPage from "../Pages/faq.jsx";
import Services from "../Pages/services.jsx";
import MyProfile from "../Pages/myProfile.jsx";
import Expertise from "../Pages/expertise.jsx";
import UserQueries from "../Pages/userQueries.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="home" replace /> },
          { path: "home", element: <Home /> },
          { path: "influencers", element: <Influencers /> },
       
          { path: "withdrawals", element: <Withdrawals /> },
          { path: "users", element: <Users /> },
          { path: "user-detail/:id", element: <UserDetail /> },
          { path: "admin-data", element: <AdminData /> },
          { path: "sponsored-content", element: <SponsoredContent /> },
          { path: "banners", element: <Banners /> },
          { path: "categories", element: <Categories /> },
          { path: "reviews", element: <Reviews /> },
          { path: "faqs", element: <FaqPage /> },
          { path: "services", element: <Services /> },
          { path: "expertise", element: <Expertise /> },
          { path: "user-queries", element: <UserQueries /> },
          { path: "my-profile", element: <MyProfile /> },
        ],
      },
    ],
  },
]);