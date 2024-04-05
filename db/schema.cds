namespace vacation;

using {
    cuid,
    managed
} from '@sap/cds/common';

type Role   : String enum {
    staff;
    manager;
}

type Status : String enum {
    pending;
    accepted;
    rejected;
}

entity Users : cuid, managed {
    username     : String;
    password     : String;
    role         : Role;
    refreshToken : String;
    requests     : Association to many Requests
                       on requests.user = $self;
}

entity Requests : cuid, managed {
    status : Status;
    reason : String;
    user   : Association to Users;
}
