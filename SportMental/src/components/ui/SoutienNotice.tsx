import { MESSAGE_SOUTIEN } from "@/content/sante";
import { Notice } from "./Notice";

/** Message bienveillant affiché si un texte libre exprime une détresse. */
export function SoutienNotice() {
  return (
    <Notice tone="care" title={MESSAGE_SOUTIEN.titre}>
      <div className="flex flex-col gap-2">
        {MESSAGE_SOUTIEN.texte.map((t) => (
          <p key={t}>{t}</p>
        ))}
        <ul className="flex flex-col gap-1">
          {MESSAGE_SOUTIEN.urgence.map((u) => (
            <li key={u.numero}>
              {u.label} :{" "}
              <a href={`tel:${u.numero.replace(/\s/g, "")}`} className="font-semibold text-accent underline">
                {u.numero}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Notice>
  );
}
