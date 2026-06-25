import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VetCard, type VetCardData } from "./VetCard";

const base: VetCardData = {
  id: "v1",
  name: "Dr. Anjali Rao",
  hospital: "Green Pastures Vet Clinic",
  phone: "+919876543210",
  address: "MG Road, Bengaluru",
  rating: 4.6,
  total_ratings: 128,
  open_now: true,
  distance_km: 2.3,
  lat: 12.97,
  lng: 77.59,
  is_government: false,
};

function getLink(label: RegExp) {
  return screen.getByRole("link", { name: label }) as HTMLAnchorElement;
}

describe("VetCard smoke (call / whatsapp / directions)", () => {
  it("renders Call link with tel: href", () => {
    render(<VetCard vet={base} />);
    const a = getLink(/Call Dr\. Anjali Rao/i);
    expect(a.getAttribute("href")).toBe("tel:+919876543210");
  });

  it("renders WhatsApp link to wa.me without plus", () => {
    render(<VetCard vet={base} />);
    const a = getLink(/WhatsApp Dr\. Anjali Rao/i);
    expect(a.getAttribute("href")).toBe("https://wa.me/919876543210");
    expect(a.target).toBe("_blank");
    expect(a.rel).toContain("noopener");
  });

  it("renders Directions link using lat/lng when no maps_url", () => {
    render(<VetCard vet={base} />);
    const a = getLink(/Directions to Dr\. Anjali Rao/i);
    expect(a.getAttribute("href")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=12.97,77.59"
    );
  });

  it("prefers explicit maps_url when present", () => {
    render(<VetCard vet={{ ...base, maps_url: "https://maps.google.com/?cid=42" }} />);
    expect(getLink(/Directions/i).getAttribute("href")).toBe(
      "https://maps.google.com/?cid=42"
    );
  });

  it("falls back to a search query when no coords/url", () => {
    render(
      <VetCard
        vet={{ ...base, lat: null, lng: null, maps_url: null, address: "X Rd", hospital: "Y Clinic" }}
      />
    );
    const href = getLink(/Directions/i).getAttribute("href")!;
    expect(href.startsWith("https://www.google.com/maps/search/?api=1&query=")).toBe(true);
    expect(decodeURIComponent(href)).toContain("Y Clinic");
  });

  it("disables Call and WhatsApp when phone missing", () => {
    render(<VetCard vet={{ ...base, phone: null }} />);
    expect(screen.queryByRole("link", { name: /Call /i })).toBeNull();
    expect(screen.queryByRole("link", { name: /WhatsApp /i })).toBeNull();
    // Directions still works
    expect(getLink(/Directions/i)).toBeTruthy();
  });

  it("shows distance, rating and open-now badges", () => {
    render(<VetCard vet={base} />);
    expect(screen.getByText(/4\.6/)).toBeInTheDocument();
    expect(screen.getByText(/2\.3 km/)).toBeInTheDocument();
    expect(screen.getByText(/Open now/i)).toBeInTheDocument();
  });
});
