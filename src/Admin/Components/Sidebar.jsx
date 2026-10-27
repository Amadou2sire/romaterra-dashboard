import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import control from "../pics/switch.png";
import logo from "../pics/logo.png";

function Sidebar({ adminRole }) {
  const [open, setOpen] = useState(true);
  const [showUserSubMenu, setShowUserSubMenu] = useState(false);

  const Menus = [
    { title: "Dashboard", src: "dashboard", link: "/home" },
    {
      title: "Orders",
      src: "order",
      iconSize: "w-1 h-1",
      gap: true,
      link: "/orders",
    },
    {
      title: "Customers",
      src: "User",
      gap: true,
      link: "/customers",
      requiresRole: "superadmin",
    },
    {
      title: "Collections",
      src: "collection",
      gap: true,
      link: "/collections",
    },
    {
      title: "Categories & Products",
      src: "categorie",
      gap: true,
      link: "/categories",
    },
    {
      title: "Shipping",
      src: "Setting",
      gap: true,
      link: "/settings",
    },
  ];

  const handleSubmenuClick = () => {
    setShowUserSubMenu(false);
  };

  const toggleUserSubMenu = () => {
    setShowUserSubMenu(!showUserSubMenu);
  };

  return (
    <div className="flex h-screen">
      <div
        className={`${
          open ? "w-72" : "w-32"
        } h-screen p-2 pt-8 relative duration-300
  bg-gradient-to-b from-[#F4E5C8]/50 via-[#F4E5C8]/75 to-[#FF4E5C8]/95
  backdrop-blur-2xl`}
      >
        <img
          src={control}
          alt="Control icon"
          className={`absolute cursor-pointer -right-4 top-12 w-9 border-[#884B2C]
          border-1 rounded-full ${!open && "rotate-180"}`}
          onClick={() => setOpen(!open)}
        />
        <div className="flex gap-x-2 items-center p-4">
          <img
            src={logo}
            alt="Logo"
            className={`cursor-pointer w-22 duration-500 block float-left ${
              open && "rotate-[360deg]"
            }`}
          />
        </div>
        <ul className="px-8">
          {Menus.filter((menu) => !menu.requiresRole || menu.requiresRole === adminRole).map((Menu, index) => (
            <li
              key={index}
              className={`flex flex-col ${Menu.gap ? "mt-5" : "mt-2"}`}
            >
              {Menu.submenus ? (
                <div
                  className={`rounded-md p-2 cursor-pointer hover:bg-[#A2664E] text-white text-sm items-center gap-x-4 
              ${Menu.gap ? "mt-5" : "mt-2"}`}
                >
                  <div onClick={toggleUserSubMenu}>
                    <div className="flex">
                      <img
                        src={require(`../pics/${Menu.src}.png`)}
                        alt={Menu.title}
                      />
                      <span
                        className={`origin-left duration-200 ml-5 text-black font-medium ${
                          !open && "hidden"
                        }`}
                      >
                        {Menu.title}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink
                  to={Menu.link}
                  className={({ isActive }) =>
                    `block rounded-md p-2 cursor-pointer hover:bg-[#A2664E] text-sm items-center gap-x-4 no-underline ${
                      Menu.gap ? "mt-5" : "mt-2"
                    } ${isActive ? "bg-[#A2664E] text-white" : " text-black"}`
                  }
                >
                  <div className="flex">
                    <img
                      src={require(`../pics/${Menu.src}.png`)}
                      alt={Menu.title}
                    />
                    <span
                      className={`origin-left duration-200 ml-5 font-medium ${
                        !open && "hidden"
                      }`}
                    >
                      {Menu.title}
                    </span>
                  </div>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
