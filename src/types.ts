interface User {
    user_id: number,
    display_name: string,
    email: string,
    username: string,
    password: string
}

interface Session {
    user_id: number,
    session_id: string
}

type UserAuth = Omit<User & Session, "password">

export {
    User,
    Session,
    UserAuth
}
