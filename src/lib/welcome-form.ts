// The fields of the welcome, checked in the browser before asking the server (specs.md, Layout):
// the errors come one at a time, the access code, then the nickname, then the personal code.
import { isPersonalCode, readNickname } from "./field-rules";

export interface WelcomeForm {
  accessCode: string;
  nickname: string;
  personalCode: string;
}

// The first field the server would refuse, with its error code, or null.
export const checkWelcome = (form: WelcomeForm) => {
  if (form.accessCode.trim() === "") {
    return { field: "accessCode", code: "missing-access-code" } as const;
  }
  if (readNickname(form.nickname) === null) {
    return { field: "nickname", code: "invalid-nickname" } as const;
  }
  if (!isPersonalCode(form.personalCode)) {
    return { field: "personalCode", code: "invalid-personal-code" } as const;
  }
  return null;
};
