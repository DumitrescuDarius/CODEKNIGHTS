"use client";

import dynamic from "next/dynamic";

const MainMenu = dynamic(() => import("../components/MainMenu"), {
  ssr: false,
});

export default function HomePage() {
  return <MainMenu />;
}
