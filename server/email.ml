type t = {
  from_addr: string; (*"me@domain.net"*)
  to_addrs: string;  (*"you@domain.com"*)
  subject: string;
  content: string;
}

let create_message params = 
  Netsendmail.compose ~from_addr:("PlantPi", params.from_addr) 
  ~to_addrs:(("you", params.to_addrs) :: [])
  ~subject:params.subject
  params.content

let send_mail message =
  Netsendmail.sendmail ~mailer:"/usr/local/bin/msmtp" message

(*example that I've tested*)
(*let _ =
  let mail = {from_addr = "elias_50@live.com"; to_addrs = "elias_50@live.com"; subject = "testing 123"; content = "did it work?"} in
  Netsendmail.sendmail ~mailer:"/usr/local/bin/msmtp" (email mail);;*)
