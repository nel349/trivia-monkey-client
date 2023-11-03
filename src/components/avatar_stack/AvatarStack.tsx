import { useMemo } from "react";
import { useEffect } from "react";
import { useSpace, useMembers } from "@ably/spaces/react";
import Avatars from "./Avatars";
import { getMemberName } from "../utils/mockNames";
// import { getMemberColor } from "../utils/mockColors";
import type { Member } from "../utils/helpers";
import styles from "./AvatarStack.module.css";
import avatarImage from '../../assets/monkeys_avatars/astronaut-monkey1-200x200.png';

const AvatarStack = () => {
  const fakeName = useMemo(getMemberName, []);

  /** 💡 Get a handle on a space instance 💡 */
  const { space } = useSpace();

  /** 💡 Enter the space as soon as it's available 💡 */
  useEffect(() => {
    let userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const obj = JSON.parse(userInfo);
        const name = obj?.name;
        console.log(name); // Logs the name to the console


        space?.enter({ name, avatar: avatarImage }).then(async () => {
          console.log('Entered space');
          const myMemberInfo = await space?.members.getSelf();
          console.log(myMemberInfo);
        });
        
    }
    
  }, [space, fakeName]);

  /** 💡 Get everybody except the local member in the space and the local member 💡 */
  const { others, self } = useMembers();

  const uniqueOthers = others.filter((user, index, self) =>
  index === self.findIndex((t) => (
    t.clientId === user.clientId
  ))
);

  return (
    <div id="avatar-stack" className={`example-container ${styles.container}`}>
      {/** 💡 Stack of first 5 user avatars including yourself.💡 */}
      <Avatars self={self as Member | null} otherUsers={uniqueOthers as Member[]} />
    </div>
  );
};

export default AvatarStack;
