using vacation from '../db/schema';

service ManagerService @(path: '/manage') {
    @Capabilities: {Insertable: false}
    entity Requests as projection on vacation.Requests;

}
