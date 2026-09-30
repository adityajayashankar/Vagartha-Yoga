import { ArrowRight, Plus } from "lucide-react";
import { Lotus, TextLink } from "./Elements";
import { faqs, sessions } from "./content";
import EnquiryForm from "./EnquiryForm";

export function Services() {
  return (
    <section
      className="sessions-section section-space container"
      id="sessions"
      aria-labelledby="sessions-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 / The practice</p>
          <h2 id="sessions-heading">
            Where are you
            <br />
            <em>starting from?</em>
          </h2>
        </div>
        <p>
          Choose the practice you would like to talk about. Every option is
          taught online, one to one.
        </p>
      </div>
      <div className="session-list">
        {sessions.map((session, i) => (
          <article
            className="session-row"
            id={`session-${session.id}`}
            key={session.id}
          >
            <span className="session-number" aria-hidden="true">
              0{i + 1}
            </span>
            <div className="session-title">
              <h3>{session.title}</h3>
              <p className="small-label">{session.audience}</p>
            </div>
            <div className="session-description">
              <p>{session.description}</p>
              <details className="session-details">
                <summary>
                  About {session.title.toLowerCase()}
                  <Plus size={17} aria-hidden="true" />
                </summary>
                <div>
                  <p>{session.detail}</p>
                  <a
                    className="text-link"
                    href="#contact"
                    data-practice={session.id}
                  >
                    Ask about {session.title.toLowerCase()}
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>
              </details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function About() {
  return (
    <section
      className="about section-space container"
      id="about"
      aria-labelledby="about-heading"
    >
      <div className="teacher-folio" id="experience">
        <div className="folio-top">
          <Lotus />
          <span>VAGARTHA YOGA</span>
        </div>
        <p className="folio-name">
          Girija
          <br />
          <em>Jayashankar</em>
        </p>
        <p className="folio-role">Yoga instructor · PGDYT</p>
        <div className="folio-bottom">
          <span className="folio-years">20+</span>
          <span>
            years of professional
            <br />
            teaching experience
          </span>
        </div>
      </div>
      <div className="about-copy">
        <p className="eyebrow">03 / Meet your teacher</p>
        <h2 id="about-heading">
          Hello,
          <br />
          <em>I’m Girija.</em>
        </h2>
        <p>
          I teach personal online yoga, including prenatal and postnatal
          practice. I have been teaching professionally for more than 20 years.
        </p>
        <p>
          We can start by talking about what brings you to yoga. You might be
          trying it for the first time, coming back after a break, or looking
          for guidance during a change in your life.
        </p>
        <p>Tell me where you are starting. We can take it from there.</p>
        <TextLink href="#contact">Write to Girija</TextLink>
      </div>
    </section>
  );
}

export function Questions() {
  return (
    <section
      className="questions section-space container"
      aria-labelledby="questions-heading"
    >
      <div>
        <p className="eyebrow">Before your first class</p>
        <h2 id="questions-heading">
          A few practical
          <br />
          <em>questions.</em>
        </h2>
      </div>
      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.question}>
            <summary>
              {faq.question}
              <Plus size={18} aria-hidden="true" />
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section
      className="contact-section section-space"
      id="contact"
      aria-labelledby="contact-heading"
    >
      <div className="container contact-layout" id="book">
        <div className="contact-copy">
          <p className="eyebrow">04 / Let’s talk</p>
          <h2 id="contact-heading">
            Tell me a little
            <br />
            <em>about yourself.</em>
          </h2>
          <p>
            Ask about a class, or send a question. Your message goes to Girija
            at{" "}
            <a href="mailto:vagarthayoga@gmail.com">vagarthayoga@gmail.com</a>.
          </p>
          <p className="contact-note">
            Include your time zone if you would like to discuss a time. Sending
            this form does not reserve a class.
          </p>
          <div className="contact-regions">
            <span className="small-label">Teaching online across</span>
            <p>India · UAE · Canada · USA</p>
          </div>
        </div>
        <EnquiryForm />
      </div>
    </section>
  );
}
