using vacation from '../db/schema';

service ManagerService @(path: '/manage') {
    entity Users    as projection on vacation.Users;

    @Capabilities: {Insertable: false}
    entity Requests as projection on vacation.Requests;

}
