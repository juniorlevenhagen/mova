import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock do Next.js Image - DEVE vir antes de importar o componente
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock do Next.js Link - DEVE vir antes de importar o componente
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  },
}));

import { Logo } from "../Logo";

describe("Logo component", () => {
  it("should render without crashing", () => {
    render(<Logo />);
    const logo = screen.getByAltText("Mova Logo");
    expect(logo).toBeInTheDocument();
  });

  it("should have a link to home page", () => {
    render(<Logo />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });
});
