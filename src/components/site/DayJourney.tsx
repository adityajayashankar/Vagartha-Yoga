import { practiceNotes } from "./content";

export default function DayJourney() {
  return (
    <section
      className="approach section-space"
      id="approach"
      aria-labelledby="approach-heading"
    >
      <div className="container approach-layout" id="journey">
        <div className="approach-intro">
          <p className="eyebrow">02 / How we practise</p>
          <h2 id="approach-heading">
            A teacher with you.
            <br />
            <em>Even from home.</em>
          </h2>
          <p>
            Personal teaching means there is time to notice how you are doing.
            You can stop to ask a question and take a little longer where you
            need it.
          </p>
          <p className="margin-note">
            The practice starts with a conversation.
          </p>
        </div>
        <ol className="practice-notes">
          {practiceNotes.map((note, i) => (
            <li key={note.title}>
              <span className="note-number" aria-hidden="true">
                0{i + 1}
              </span>
              <div>
                <h3>{note.title}</h3>
                <p>{note.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
