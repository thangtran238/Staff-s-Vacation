using vacation from '../db/schema';

type Token {
    id   : UUID;
    role : String; //staff, manager
}

service AuthService @(path: '/auth') {
    entity Users as projection on vacation.Users;
    function login(username : String, password : String) returns String;
    action   token(user : Users)                         returns Token;
}
