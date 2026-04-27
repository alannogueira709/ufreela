import Link from "next/link";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer"
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

const platformLinks = [
  { label: "Encontre Vagas", href: "/jobs" },
  { label: "Publique Vagas", href: "/jobs/post" },
];

const resourceLinks = [
  { label: "Termos", href: "/terms" },
  { label: "Privacidade", href: "/privacy" },
  { label: "Suporte", href: "/support" },
];

const socialLinks = [
  { label: "Twitter", href: "https://twitter.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Instagram", href: "https://instagram.com" },
];

const footerLinkClassName =
  "text-[15px] font-medium text-slate-400 underline decoration-slate-300 underline-offset-4 transition-colors duration-300 ease-in-out hover:text-blue-600 hover:decoration-blue-200";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <Link
              href="/"
              className="font-heading text-4xl font-bold tracking-tight text-slate-950"
            >
              uFreela
            </Link>
            <p className="max-w-sm text-[15px] font-medium leading-6 text-slate-400">
              Uma plataforma para conectar o ecossistema de inovação.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-xl font-semibold text-slate-950">
              Platforma
            </h3>
            <div className="flex flex-col gap-3">
              <Drawer>
                <DrawerTrigger asChild>
                  <Link href="#" className={footerLinkClassName}>
                    Sobre 
                  </Link>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle className="font-heading text-2xl text-slate-900">Sobre o uFreela</DrawerTitle>
                    <Separator />
                    <DrawerDescription className="text-base text-slate-600 text-justify">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et justo eu leo venenatis vulputate id sodales ante. Mauris ultricies accumsan eros, sit amet imperdiet elit faucibus a. Morbi nec nulla ex. Aliquam ac placerat ex. Sed gravida lacinia mi, maximus tristique risus finibus vitae. Pellentesque consequat augue ac nulla cursus, at tempus neque dignissim. Integer dignissim, mi eget laoreet vehicula, elit orci dictum leo, quis efficitur quam lorem nec turpis. Etiam ullamcorper est purus, eget aliquet lectus tincidunt ut. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Maecenas in nulla sed nibh interdum sollicitudin commodo consequat enim. Morbi euismod enim eu fringilla malesuada. Fusce sed augue quis risus vehicula venenatis in sit amet ipsum. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Phasellus auctor nibh sed velit convallis, a condimentum risus aliquet. Phasellus congue velit eu ipsum porttitor, ut sodales odio vestibulum. Nunc a eros interdum, efficitur diam ut, feugiat nisi.

                      Curabitur gravida porta turpis at accumsan. Aenean finibus mollis purus a pulvinar. Sed quis facilisis dui. Nam mattis purus id nisi rhoncus, vel mattis nisi placerat. Curabitur tincidunt iaculis diam ut venenatis. Maecenas non felis quis ligula dictum lacinia.
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <Button className="w-full" variant="link">Fechar</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
              {platformLinks.map((link) => (
                <Link key={link.href} href={link.href} className={footerLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-heading text-xl font-semibold text-slate-950">
              Recursos
            </h3>
            <div className="flex flex-col gap-3">
              {resourceLinks.map((link) => (
                <Link key={link.href} href={link.href} className={footerLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-heading text-xl font-semibold text-slate-950">
              Social
            </h3>
            <div className="flex flex-col gap-3">
              {socialLinks.map((link) => (
                <Link key={link.href} href={link.href} className={footerLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-center text-[15px] font-medium text-slate-400">
            © 2026 uFreela. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
