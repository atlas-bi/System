from names_generator import generate_name
import requests

doc = """
# Root creation
dn: dc=example,dc=org
objectClass: dcObject
objectClass: organization
dc: example
o: example

dn: ou=users,dc=example,dc=org
objectClass: organizationalUnit
ou: users


"""

groups = """
# Group creation
dn: cn=admins,ou=users,dc=example,dc=org
cn: admins
objectClass: groupOfNames
member: cn=user1,ou=users,dc=example,dc=org
member: cn=user2,ou=users,dc=example,dc=org
member: cn=user3,ou=users,dc=example,dc=org
member: cn=user4,ou=users,dc=example,dc=org


dn: cn=readers,ou=users,dc=example,dc=org
cn: readers
objectClass: groupOfNames
"""

r = requests.get("https://randomuser.me/api/?results=200")

for x, person in enumerate(r.json()["results"]):
    p = requests.get(person["picture"]["thumbnail"])

    byte_string = ' '.join([str(x) for x in list(p.content)])
    doc += f"""

# User user{x} creation
dn: cn={person['login']["username"]},ou=users,dc=example,dc=org
cn: {person["login"]["username"]}
sn: {person["email"]}
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
userPassword: password
uid: {person["login"]["username"]}
uidNumber: {x}
gidNumber: {x}
homeDirectory: /home/{person["login"]["username"]}
givenName: {person["name"]["first"]}
displayName: {person["name"]["last"]}
jpegPhoto: {byte_string}

"""

    groups += f"member: cn={person['login']['username']},ou=users,dc=example,dc=org\n"

doc += groups

with open("config.ldif", "w", encoding="utf8") as file:
    file.write(doc)
