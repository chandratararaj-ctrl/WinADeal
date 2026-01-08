import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">WinADeal</h3>
                        <p className="text-sm mb-4">
                            Your one-stop platform for food delivery, grocery shopping, and hyperlocal commerce.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-sky-400 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-sky-400 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-sky-400 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/shops" className="hover:text-sky-400 transition-colors">
                                    Browse Shops
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-sky-400 transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-sky-400 transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="hover:text-sky-400 transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Partners */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">For Partners</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/vendor/register" className="hover:text-sky-400 transition-colors">
                                    Partner with us
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="hover:text-sky-400 transition-colors">
                                    Become a Delivery Partner
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-sky-400 transition-colors">
                                    Terms & Conditions
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-sky-400 transition-colors">
                                    Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start space-x-2">
                                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>123 Main Street, Mumbai, Maharashtra 400001</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <Phone className="w-5 h-5 flex-shrink-0" />
                                <span>+91 99999 99999</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <Mail className="w-5 h-5 flex-shrink-0" />
                                <span>support@winadeal.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
                    <p>&copy; {new Date().getFullYear()} WinADeal. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
