using vacation from '../db/schema';


service AuthService @(path: '/auth') {

    @readonly
    entity Users as
        projection on vacation.Users
        excluding {
            password,
            createdBy,
            createdAt,
            modifiedBy,
            modifiedAt,
            refreshToken
        };

    action   login(username : String, password : String)                                                   returns String;
    action   signup(username : String, password : String, fname : String, address : String, role : String) returns String;
    function refresh()                                                                                     returns String;
}
