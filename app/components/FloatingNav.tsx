import React from "react";
import { NavLink } from "react-router-dom";

const FloatingNav: React.FC = () => (
  <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-lg py-2 px-4 flex justify-between items-center">
    <NavLink
      to="/recipes"
      className={({ isActive }) =>
        `flex-1 text-center py-2 mx-1 rounded-full transition ${
          isActive
            ? "bg-gray-200 dark:bg-gray-700 text-blue-500"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`
      }
    >
      Recipes
    </NavLink>
    <NavLink
      to="/cooking"
      className={({ isActive }) =>
        `flex-1 text-center py-2 mx-1 rounded-full transition ${
          isActive
            ? "bg-gray-200 dark:bg-gray-700 text-blue-500"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`
      }
    >
      Cooking
    </NavLink>
    <NavLink
      to="/"
      end
      className={({ isActive }) =>
        `flex-1 text-center py-2 mx-1 rounded-full transition ${
          isActive
            ? "bg-gray-200 dark:bg-gray-700 text-blue-500"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`
      }
    >
      Home
    </NavLink>
    <NavLink
      to="/inventory"
      className={({ isActive }) =>
        `flex-1 text-center py-2 mx-1 rounded-full transition ${
          isActive
            ? "bg-gray-200 dark:bg-gray-700 text-blue-500"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`
      }
    >
      Inventory
    </NavLink>
  </nav>
);

export default FloatingNav;
