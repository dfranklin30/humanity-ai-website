import { Route, Switch } from "wouter";
import KidsLayout from "./components/KidsLayout";
import Home from "./pages/Home";
import Program from "./pages/Program";
import Curriculum from "./pages/Curriculum";
import Pricing from "./pages/Pricing";
import Parents from "./pages/Parents";
import Schools from "./pages/Schools";
import Scholarships from "./pages/Scholarships";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Contact from "./pages/Contact";
import Enroll from "./pages/Enroll";
import EnrollReceived from "./pages/EnrollReceived";
import Brochure from "./pages/Brochure";
import StudioApp from "./studio/StudioApp";
import FacilitatorApp from "./studio/FacilitatorApp";
import { BASE } from "./content/program";
import { Button, Section } from "./components/ui";

function KidsNotFound() {
  return (
    <Section tone="gradient">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-6xl font-extrabold text-blue-600">404</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          That page isn't here
        </h1>
        <p className="mt-3 text-slate-600">
          It may have moved. The academy home page has everything.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href={BASE}>Academy home</Button>
          <Button href={`${BASE}/contact`} variant="secondary">
            Contact us
          </Button>
        </div>
      </div>
    </Section>
  );
}

/**
 * Self-contained AI Builders Academy site mounted under /aiforkids.
 *
 * This module imports nothing from the parent Humanity + AI site other than
 * shared runtime libraries, so it can be lifted into a standalone deployment
 * (aibuildersacademy.org, ai4kids.org, …) by changing BASE and pointing the
 * API calls at the same endpoints.
 */
export default function AiForKidsApp() {
  return (
    <Switch>
      {/* Print-only brochure routes render without the site chrome. */}
      <Route path={`${BASE}/brochure/schools`}>
        <Brochure variant="schools" />
      </Route>
      <Route path={`${BASE}/brochure/curriculum`}>
        <Brochure variant="curriculum" />
      </Route>
      <Route path={`${BASE}/brochure/parents`}>
        <Brochure variant="parents" />
      </Route>

      {/* Kids AI Studio: the guarded, facilitator-supervised space where
          children direct AI. Renders its own chrome (no marketing nav). */}
      <Route path={`${BASE}/studio`} component={StudioApp} />
      <Route path={`${BASE}/studio/*`} component={StudioApp} />
      <Route path={`${BASE}/facilitator`} component={FacilitatorApp} />
      <Route path={`${BASE}/facilitator/*`} component={FacilitatorApp} />

      <Route>
        <KidsLayout>
          <Switch>
            <Route path={BASE} component={Home} />
            <Route path={`${BASE}/`} component={Home} />
            <Route path={`${BASE}/program`} component={Program} />
            <Route path={`${BASE}/curriculum`} component={Curriculum} />
            <Route path={`${BASE}/pricing`} component={Pricing} />
            <Route path={`${BASE}/parents`} component={Parents} />
            <Route path={`${BASE}/schools`} component={Schools} />
            <Route path={`${BASE}/scholarships`} component={Scholarships} />
            <Route path={`${BASE}/about`} component={About} />
            <Route path={`${BASE}/faq`} component={Faq} />
            <Route path={`${BASE}/contact`} component={Contact} />
            <Route path={`${BASE}/enroll`} component={Enroll} />
            <Route path={`${BASE}/enroll/received`} component={EnrollReceived} />
            <Route component={KidsNotFound} />
          </Switch>
        </KidsLayout>
      </Route>
    </Switch>
  );
}
