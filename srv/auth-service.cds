using vacation from '../db/schema';


service AuthService @(path: '/auth') {
    entity Users as projection on vacation.Users;
    action login(username : String, password : String) returns String;
}